"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/capacitor";

const KEY = "lori.supabase.session.v1";

type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
};

/**
 * Mirrors the Supabase auth session to Capacitor Preferences on iOS /
 * Android so it survives app-process termination, which WKWebView's
 * default cookie storage doesn't always do reliably.
 *
 * Flow:
 *   1. On mount (native only): if Supabase has no current session AND
 *      Preferences has a stored one, restore via `setSession()`.
 *      This brings the user back into authenticated state without a
 *      re-login.
 *   2. Subscribe to onAuthStateChange:
 *        - SIGNED_IN, TOKEN_REFRESHED → write to Preferences
 *        - SIGNED_OUT, USER_DELETED   → clear Preferences
 *
 * The BiometricGate then sees a valid session and prompts Face ID
 * instead of skipping to /login.
 *
 * Web is a no-op (cookies persist fine in regular browsers).
 */
export function NativeSessionPersistence() {
  useEffect(() => {
    if (!isNative()) return;

    let unsub: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      const { Preferences } = await import("@capacitor/preferences");
      const supabase = createClient();

      // Try to restore from Preferences if Supabase doesn't have one yet.
      try {
        const { value } = await Preferences.get({ key: KEY });
        if (value && !cancelled) {
          const stored = JSON.parse(value) as StoredSession;
          const { data: current } = await supabase.auth.getSession();
          const expired =
            stored.expires_at != null && stored.expires_at * 1000 < Date.now();
          if (!current.session && !expired && stored.refresh_token) {
            await supabase.auth.setSession({
              access_token: stored.access_token,
              refresh_token: stored.refresh_token,
            });
          } else if (expired && stored.refresh_token) {
            // Access token is past expiration but refresh might still work.
            await supabase.auth.refreshSession({
              refresh_token: stored.refresh_token,
            });
          }
        }
      } catch (err) {
        // Don't block app boot on persistence errors.
        console.warn("[native-session] restore failed", err);
      }

      // Subscribe so future logins / refreshes get mirrored.
      const { data: sub } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (
              (event === "SIGNED_IN" ||
                event === "TOKEN_REFRESHED" ||
                event === "USER_UPDATED") &&
              session?.access_token &&
              session.refresh_token
            ) {
              const payload: StoredSession = {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at ?? null,
              };
              await Preferences.set({ key: KEY, value: JSON.stringify(payload) });
            } else if (event === "SIGNED_OUT") {
              await Preferences.remove({ key: KEY });
            }
          } catch (err) {
            console.warn("[native-session] mirror failed", event, err);
          }
        },
      );
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  return null;
}
