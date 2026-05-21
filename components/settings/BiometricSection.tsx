"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Loader2, Check, X } from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isNative } from "@/lib/capacitor";
import {
  isBiometricEnrolled,
  setBiometricEnrolled,
} from "@/components/auth/BiometricGate";

type State = "loading" | "unsupported" | "off" | "on";

/**
 * Settings → Account → Face ID / Touch ID toggle.
 *
 * Visible only on native iOS / Android shells with biometry hardware.
 * On web (browser) and on devices without biometrics this renders nothing.
 */
export function BiometricSection() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      if (!isNative()) {
        if (!cancelled) setState("unsupported");
        return;
      }
      try {
        const mod = await import("@aparajita/capacitor-biometric-auth");
        const status = await mod.BiometricAuth.checkBiometry();
        if (cancelled) return;
        if (!status.isAvailable) {
          setState("unsupported");
          return;
        }
        setState(isBiometricEnrolled() ? "on" : "off");
      } catch {
        if (!cancelled) setState("unsupported");
      }
    }
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const mod = await import("@aparajita/capacitor-biometric-auth");
      await mod.BiometricAuth.authenticate({
        reason: "Confirme sua identidade pra ativar o desbloqueio rápido",
        cancelTitle: "Agora não",
        allowDeviceCredential: true,
        iosFallbackTitle: "Usar senha",
        androidTitle: "Ativar desbloqueio rápido",
        androidConfirmationRequired: false,
      });
      setBiometricEnrolled(true);
      setState("on");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ativar");
    } finally {
      setBusy(false);
    }
  }

  function disable() {
    setBiometricEnrolled(false);
    setState("off");
    setError(null);
  }

  if (state === "loading") return null;
  if (state === "unsupported") return null;

  const isOn = state === "on";

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-deep dark:bg-sky/20 dark:text-sky-soft"
        >
          <Fingerprint size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle>Face ID / Touch ID</CardTitle>
          <CardDesc>
            {isOn
              ? "Desbloqueio rápido ativado. Da próxima vez que abrir o app, use sua biometria."
              : "Desbloqueie o app sem digitar a senha — use Face ID, Touch ID ou seu PIN."}
          </CardDesc>
        </div>
        <span
          aria-hidden
          className={
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full " +
            (isOn
              ? "bg-grass text-white"
              : "bg-cloud-deep/40 text-ink/40 dark:bg-ink-light/60 dark:text-cloud/40")
          }
        >
          {isOn ? <Check size={14} /> : <X size={14} />}
        </span>
      </div>
      <div className="mt-4">
        {isOn ? (
          <Button
            variant="outline"
            size="md"
            onClick={disable}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            Desativar
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={enable}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            {busy ? (
              <Loader2 size={16} aria-hidden className="animate-spin" />
            ) : (
              <Fingerprint size={16} aria-hidden />
            )}
            {busy ? "Ativando…" : "Ativar agora"}
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-3 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}
    </Card>
  );
}
