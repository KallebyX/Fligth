"use client";

import { useEffect, useState } from "react";
import { Loader2, Fingerprint, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/capacitor";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";

const STORAGE_KEY = "capitao-lori.biometric-enabled";

// Read the user's opt-in flag. Stored in localStorage so it survives launches
// and is per-WebView (per-app on native). Defaults to false until enrolled.
export function isBiometricEnrolled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setBiometricEnrolled(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(STORAGE_KEY, "1");
  else window.localStorage.removeItem(STORAGE_KEY);
}

type GateState = "checking" | "locked" | "unlocked" | "skipped";

/**
 * Wraps the app on Capacitor native. Boot sequence:
 *  1. Detect native + has Supabase session + user opted in
 *  2. If all true: blur the children behind a lock screen, prompt Face ID
 *  3. On success: reveal children
 *  4. On fail / cancel: offer "Entrar com senha" → sign out + send to /login
 *
 * On the web (browser) or when biometric isn't enrolled, this is a no-op
 * passthrough that just renders {children}.
 */
export function BiometricGate({ children }: { children: React.ReactNode }) {
  // Optimistic: web and unenrolled native devices skip immediately. Avoids
  // a flash of loading spinner on every page load.
  const [state, setState] = useState<GateState>(() => {
    if (typeof window === "undefined") return "skipped";
    if (!isNative() || !isBiometricEnrolled()) return "skipped";
    return "checking";
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "checking") return;
    let cancelled = false;

    async function boot() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Nothing to gate — user is anonymous, let them hit /login normally.
        if (!cancelled) setState("skipped");
        return;
      }

      if (!cancelled) setState("locked");
      await promptBiometric().then(
        () => !cancelled && setState("unlocked"),
        (err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Falha na biometria");
            setState("locked");
          }
        },
      );
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [state]);

  async function promptBiometric() {
    const mod = await import("@aparajita/capacitor-biometric-auth");
    const check = await mod.BiometricAuth.checkBiometry();
    if (!check.isAvailable) {
      throw new Error("Biometria não disponível neste dispositivo.");
    }
    await mod.BiometricAuth.authenticate({
      reason: "Desbloquear o Capitão Lorí",
      cancelTitle: "Usar senha",
      allowDeviceCredential: true,
      iosFallbackTitle: "Usar senha",
      androidTitle: "Desbloquear Capitão Lorí",
      androidSubtitle: "Confirme sua identidade",
      androidConfirmationRequired: false,
    });
  }

  async function retry() {
    setError(null);
    try {
      await promptBiometric();
      setState("unlocked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na biometria");
    }
  }

  async function logoutAndPasswordLogin() {
    setBiometricEnrolled(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (state === "checking" || state === "skipped" || state === "unlocked") {
    // Render children. During "checking" we render them too so first paint
    // isn't delayed; the lock overlay comes on top once we know we need it.
    return (
      <>
        {children}
        {state === "checking" && (
          <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-cloud/40 backdrop-blur-sm">
            <Loader2 className="animate-spin text-sky" size={40} />
          </div>
        )}
      </>
    );
  }

  // state === "locked"
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[59] bg-cloud/95 backdrop-blur-md" />
      <main
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="biometric-title"
      >
        <Mascot state="happy" size={120} />
        <h1 id="biometric-title" className="mt-4 text-2xl font-black">
          Desbloqueie o Capitão Lorí
        </h1>
        <p className="mt-1 max-w-xs text-sm text-ink/65">
          Use Face ID, Touch ID ou seu PIN para continuar.
        </p>
        {error && (
          <p className="mt-4 max-w-xs rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
            {error}
          </p>
        )}
        <div className="mt-6 grid w-full max-w-xs gap-2">
          <Button size="lg" onClick={retry} className="w-full">
            <Fingerprint size={18} />
            Tentar novamente
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={logoutAndPasswordLogin}
            className="w-full"
          >
            <LogIn size={18} />
            Entrar com senha
          </Button>
        </div>
      </main>
    </>
  );
}
