"use client";

import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/capacitor";

const KEY = "lori.supabase.session.v1";

type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
};

/**
 * Make the user "log in once per device" on native iOS / Android.
 *
 * Why this exists:
 *   • Supabase's default cookie storage in WKWebView is unreliable
 *     across app launches.
 *   • Even when cookies persist, the access token expires every hour
 *     and the SDK's silent refresh only runs while the WebView is
 *     active — so when the user reopens the app after a few hours
 *     the cookie is "valid" but stale, and the next request fails.
 *
 * Strategy:
 *   1. Mirror every Supabase session to Capacitor Preferences (secure
 *      on-disk storage). This survives force-quit, OS reboot, and
 *      even iCloud restores on a new device.
 *   2. On mount AND every time the app comes back to the foreground
 *      (`appStateChange`), call `refreshSession()` so the token is
 *      always fresh before the user makes their next request.
 *   3. Schedule a proactive refresh ~5 minutes before each access
 *      token expires so background traffic doesn't catch a 401.
 *   4. On SIGNED_OUT, wipe Preferences — the user clicked log out,
 *      they explicitly want the device to forget them.
 *
 * Net effect: a user who logged in once stays logged in until they
 * tap "Sair" or until the refresh token chain dies (which only
 * happens if Supabase admin invalidates it).
 */
export function NativeSessionPersistence() {
  useEffect(() => {
    if (!isNative()) return;

    let unsub: (() => void) | null = null;
    let resumeUnsub: (() => void) | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    async function scheduleProactiveRefresh(expiresAt: number | null | undefined) {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
      if (!expiresAt) return;
      // Refresh 5 minutes (300s) before expiration, but never sooner
      // than 10 seconds from now (avoids burst on rapid SIGN_IN events).
      const ms = Math.max(10_000, expiresAt * 1000 - Date.now() - 300_000);
      refreshTimer = setTimeout(() => {
        const supabase = createClient();
        void supabase.auth.refreshSession().catch((err) => {
          console.warn("[native-session] proactive refresh failed", err);
        });
      }, ms);
    }

    async function refreshIfStale() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const expiresAt = data.session?.expires_at ?? 0;
        // Refresh if the access token expires within the next minute,
        // or has already expired.
        if (expiresAt - 60 < Math.floor(Date.now() / 1000)) {
          await supabase.auth.refreshSession();
        }
      } catch (err) {
        console.warn("[native-session] resume refresh failed", err);
      }
    }

    void (async () => {
      const { Preferences } = await import("@capacitor/preferences");
      const supabase = createClient();

      // 1. Restore session from Preferences if Supabase doesn't have one.
      try {
        const { value } = await Preferences.get({ key: KEY });
        if (value && !cancelled) {
          const stored = JSON.parse(value) as StoredSession;
          const { data: current } = await supabase.auth.getSession();
          if (!current.session && stored.refresh_token) {
            // Always refresh — even if access_token still looks valid in
            // the stored copy, it might be stale (the app was closed
            // for hours). refreshSession() succeeds as long as the
            // refresh token chain is alive.
            try {
              await supabase.auth.refreshSession({
                refresh_token: stored.refresh_token,
              });
            } catch {
              // Fall back to setSession with the stored access token
              // so a transient network blip doesn't force re-login.
              await supabase.auth.setSession({
                access_token: stored.access_token,
                refresh_token: stored.refresh_token,
              });
            }
          }
        }
      } catch (err) {
        console.warn("[native-session] restore failed", err);
      }

      // 2. Listen for auth events to keep Preferences mirrored.
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
              void scheduleProactiveRefresh(session.expires_at);
            } else if (event === "SIGNED_OUT") {
              await Preferences.remove({ key: KEY });
              if (refreshTimer) {
                clearTimeout(refreshTimer);
                refreshTimer = null;
              }
            }
          } catch (err) {
            console.warn("[native-session] mirror failed", event, err);
          }
        },
      );
      unsub = () => sub.subscription.unsubscribe();

      // 3. When the app comes back from background, force a refresh
      //    so the next user action doesn't hit a 401.
      try {
        const handle = await CapApp.addListener("appStateChange", (state) => {
          if (state.isActive) void refreshIfStale();
        });
        resumeUnsub = () => void handle.remove();
      } catch (err) {
        console.warn("[native-session] appStateChange listener failed", err);
      }

      // 4. Schedule first proactive refresh based on current session.
      const { data: now } = await supabase.auth.getSession();
      void scheduleProactiveRefresh(now.session?.expires_at);
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
      if (resumeUnsub) resumeUnsub();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  return null;
}
