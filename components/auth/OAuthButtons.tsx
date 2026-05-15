"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/capacitor";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Provider = "google" | "apple";

const NATIVE_DEEP_LINK = "capitaolori://callback";

export function OAuthButtons({
  next = "/learn",
  className = "",
}: {
  next?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setBusy(provider);
    setError(null);
    try {
      const supabase = createClient();
      const native = isNative();
      // Web: Supabase handles the entire redirect dance via the browser.
      // Native: we open the OAuth URL in Safari View Controller via
      // @capacitor/browser. Supabase's redirect target is the custom URL
      // scheme `capitaolori://callback`, which iOS / Android forwards back
      // into the app, where NativeOAuthListener exchanges the code.
      const redirectTo = native
        ? `${NATIVE_DEEP_LINK}?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/callback?next=${encodeURIComponent(next)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: native,
        },
      });
      if (error) throw error;

      if (native) {
        const url = data?.url;
        if (!url) throw new Error("Supabase não devolveu a URL OAuth.");
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url, presentationStyle: "popover" });
        // Don't reset busy — the SafariViewController owns the screen until
        // it returns; NativeOAuthListener navigates us after the exchange.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar login");
      setBusy(null);
    }
  }

  // On non-iOS, Apple Sign-In is still functional but the App Store guideline
  // 4.8 only mandates it for iOS apps that ship other social logins. We show
  // both regardless — choice belongs to the user.

  return (
    <div className={className}>
      <div className="flex items-center gap-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-ink/40">
        <span className="h-px flex-1 bg-cloud-deep/40" />
        ou continue com
        <span className="h-px flex-1 bg-cloud-deep/40" />
      </div>

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center"
          onClick={() => signIn("apple")}
          disabled={busy !== null}
          aria-label="Continuar com Apple"
        >
          {busy === "apple" ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <AppleLogo />
          )}
          Apple
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center"
          onClick={() => signIn("google")}
          disabled={busy !== null}
          aria-label="Continuar com Google"
        >
          {busy === "google" ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <GoogleLogo />
          )}
          Google
        </Button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}

      {!isNative() && (
        <p className="mt-3 text-center text-[11px] text-ink/45">
          Você será redirecionado para autorizar o acesso.
        </p>
      )}
    </div>
  );
}

function AppleLogo() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.42 2.21-1.16 3.04-.81.9-2.13 1.59-3.22 1.5-.13-1.1.42-2.27 1.13-3.02C13.96 2.02 15.4 1.43 16.365 1.43Zm4.34 17.05c-.69 1.6-1.02 2.32-1.92 3.74-1.25 1.97-3.02 4.43-5.21 4.44-1.95.01-2.45-1.27-5.1-1.26-2.65.01-3.2 1.29-5.15 1.27-2.19-.02-3.87-2.23-5.12-4.2C-1.6 18.1-2.5 11.83.71 8.18c1.92-2.18 4.96-2.46 6.97-1.36 2 1.1 2.62 1.1 4.64-.03 1.76-.95 3.36-1.55 5.07-.85 2 .82 3.55 2.58 3.74 4.95-3.06 1.55-2.6 5.95.58 7.6Z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" width={18} height={18}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.2 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.2 29 4 24 4 16.3 4 9.6 8.4 6.3 14.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5 0 9.5-1.9 12.9-5l-6-5c-2 1.4-4.5 2.3-6.9 2.3-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.5 16.1 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4-3.9 5.4l6 5C40.9 35.3 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5Z"
      />
    </svg>
  );
}
