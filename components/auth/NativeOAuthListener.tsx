"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/capacitor";

// On native (iOS / Android), OAuth opens in an external in-app browser
// (Safari View Controller via @capacitor/browser). When the OAuth provider
// + Supabase finishes the round-trip, Supabase redirects to our custom
// `capitaolori://callback?code=...&next=...` URL. iOS opens that URL via
// the system, which fires Capacitor's `appUrlOpen` event in our WebView.
//
// We intercept it here, close the external browser, exchange the code for a
// session, and navigate to the destination.
export function NativeOAuthListener() {
  const router = useRouter();

  useEffect(() => {
    if (!isNative()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ App }, { Browser }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
      ]);

      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith("capitaolori://callback")) return;

        // Always tear down the SafariViewController so the user lands
        // back inside the app even when the exchange below fails.
        try {
          await Browser.close();
        } catch {
          /* no-op — Browser may already be dismissed */
        }

        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        const errorDesc =
          parsed.searchParams.get("error_description") ?? parsed.searchParams.get("error");
        const next = parsed.searchParams.get("next") ?? "/learn";

        if (errorDesc) {
          router.push(`/login?error=${encodeURIComponent(errorDesc)}`);
          return;
        }
        if (!code) {
          router.push("/login");
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.push(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        // For first-time OAuth users (no username yet), the same /onboarding
        // routing we do on the web server callback applies — but checking
        // profile here would require another roundtrip. Just push and let
        // /learn or /onboarding sort it out via middleware + page load.
        router.push(next);
        router.refresh();
      });
      cleanup = () => handle.remove();
    })();

    return () => {
      cleanup?.();
    };
  }, [router]);

  return null;
}
