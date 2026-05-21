"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";
import {
  ensureRevenueCat,
  hasProEntitlementLocal,
} from "@/lib/revenuecat";

/**
 * On iOS / Android cold-start, reads the current RevenueCat customerInfo
 * (which StoreKit / Play Billing populate before any webhook) and, if
 * the entitlement is active but the local Supabase `pro_until` looks
 * stale, fetches a fresh /api/me to trigger a server refresh.
 *
 * Why: after a successful purchase on iOS, the RC webhook fires from
 * Apple → RevenueCat → our /api/revenuecat/webhook. That can take a
 * few seconds. Without this component the UI shows "free" until the
 * webhook lands. With it, the user sees Pro immediately.
 *
 * Web: no-op (Stripe drives state synchronously via redirect).
 */
export function NativeProSync() {
  useEffect(() => {
    const platform = detectPlatform();
    if (!(platform === "ios" || platform === "android") || !NATIVE_IAP_ENABLED) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user?.id) return;
        await ensureRevenueCat(data.user.id);

        const pro = await hasProEntitlementLocal();
        if (cancelled || !pro.isPro) return;

        // Local cache says Pro is active. Check if Supabase agrees.
        const { data: stats } = await supabase
          .from("user_stats")
          .select("pro_until")
          .eq("user_id", data.user.id)
          .single();

        const dbPro =
          stats?.pro_until && new Date(stats.pro_until).getTime() > Date.now();

        if (!dbPro) {
          // Out of sync — kick the webhook by hitting a server endpoint
          // that will reconcile based on the RC customerInfo on demand.
          // The endpoint is best-effort; the actual write happens
          // server-side via service-role.
          await fetch("/api/me/sync-pro", {
            method: "POST",
            credentials: "include",
          }).catch(() => undefined);
        }
      } catch (err) {
        console.warn("[native-pro-sync] failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
