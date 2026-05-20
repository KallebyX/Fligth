"use client";

import { useEffect, useState, useTransition } from "react";
import { RotateCcw, Check, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";
import {
  ensureRevenueCat,
  restoreNativePurchases,
} from "@/lib/revenuecat";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "restoring" }
  | { kind: "ok"; restored: number; hasPro: boolean }
  | { kind: "error"; message: string };

/**
 * "Restore Purchases" button — required by App Store Review Guideline 3.1.1.
 *
 * Visible only on native iOS / Android when IAP is enabled. On the web
 * we render nothing (Stripe sessions don't need restore). After a
 * successful restore the RevenueCat webhook updates `pro_until` on the
 * server within a few seconds; we trigger a `router.refresh()`-style
 * reload here so the UI catches up.
 */
export function RestoreButton({
  variant = "outline",
  className,
  onRestored,
}: {
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  onRestored?: () => void;
}) {
  const t = useTranslations("pro.restore");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [, start] = useTransition();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    if ((p === "ios" || p === "android") && NATIVE_IAP_ENABLED) setVisible(true);
  }, []);

  if (!visible) return null;

  function handleClick() {
    setStatus({ kind: "restoring" });
    start(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.id) {
          await ensureRevenueCat(data.user.id);
        }
        const res = await restoreNativePurchases();
        if (!res.ok) {
          setStatus({ kind: "error", message: res.error });
          return;
        }
        setStatus({ kind: "ok", restored: res.restored, hasPro: res.hasPro });
        if (onRestored) onRestored();
        // Give RevenueCat a beat to fire the webhook + Supabase to absorb
        // the pro_until update, then refresh the page.
        if (res.hasPro) {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (err) {
        const e = err as { message?: string };
        setStatus({ kind: "error", message: e.message ?? "restore_failed" });
      }
    });
  }

  const busy = status.kind === "restoring";

  return (
    <div className={className}>
      <Button
        size="md"
        variant={variant}
        className="w-full"
        onClick={handleClick}
        disabled={busy}
        aria-label={t("button")}
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <RotateCcw size={16} aria-hidden />
        )}
        <span>{busy ? t("restoring") : t("button")}</span>
      </Button>

      {status.kind === "ok" && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-grass/10 px-3 py-2 text-sm font-bold text-grass-deep dark:bg-grass/20 dark:text-grass-soft">
          <Check size={14} aria-hidden />
          {status.hasPro
            ? t("foundPro")
            : status.restored > 0
              ? t("restoredCount", { count: status.restored })
              : t("nothingToRestore")}
        </p>
      )}

      {status.kind === "error" && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          <AlertCircle size={14} aria-hidden />
          {t("failed")}
        </p>
      )}
    </div>
  );
}
