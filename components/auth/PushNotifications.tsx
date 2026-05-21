"use client";

import { useEffect } from "react";
import { isNative, getPlatform } from "@/lib/capacitor";
import { registerPushToken } from "@/app/actions/pushToken";

// Mounted once at root in authenticated areas. On native, asks for push
// permission lazily (after login is confirmed), registers the device token
// with APNs/FCM, and persists it in public.push_tokens.
//
// No-op on web — Web Push would use a separate flow via the service worker,
// not the Capacitor plugin.
export function PushNotifications() {
  useEffect(() => {
    if (!isNative()) return;
    const platform = getPlatform();
    if (platform !== "ios" && platform !== "android") return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { PushNotifications: PN } = await import("@capacitor/push-notifications");

      // Don't auto-prompt — only request when user explicitly opts in
      // via the toggle in /profile/edit. But if permission was already
      // granted on a prior session, register with the OS to refresh
      // the token (it can rotate).
      const status = await PN.checkPermissions();
      if (status.receive !== "granted") return;

      await PN.register();

      const regSub = await PN.addListener("registration", async (token) => {
        await registerPushToken({
          token: token.value,
          platform,
          deviceLabel: navigator.userAgent.slice(0, 120),
        });
      });
      const errSub = await PN.addListener("registrationError", () => {
        // Surfacing this is not super useful to the user; silent fail and
        // re-attempt next session. Sentry can pick it up via global handler.
      });

      cleanup = () => {
        regSub.remove();
        errSub.remove();
      };
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return null;
}
