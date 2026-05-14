"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, X } from "lucide-react";
import { isNative } from "@/lib/capacitor";
import { Button } from "@/components/ui/button";
import { isBiometricEnrolled, setBiometricEnrolled } from "@/components/auth/BiometricGate";

const DISMISSED_KEY = "capitao-lori.biometric-prompt-dismissed";

/**
 * Shows a one-time banner after first successful login on native asking
 * the user to opt-in to Face ID / Touch ID for the next app launch.
 *
 * Hidden when:
 *  - Not running on Capacitor native
 *  - User already enrolled (handled by BiometricGate)
 *  - User dismissed this prompt before
 *  - Biometry hardware isn't available
 */
export function BiometricEnrollPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!isNative()) return;
      if (isBiometricEnrolled()) return;
      if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;

      try {
        const mod = await import("@aparajita/capacitor-biometric-auth");
        const status = await mod.BiometricAuth.checkBiometry();
        if (!cancelled && status.isAvailable) setShow(true);
      } catch {
        // Plugin not registered (e.g. running native shell without rebuild).
      }
    }
    void check();
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
        reason: "Ative o desbloqueio rápido do Capitão Lorí",
        cancelTitle: "Agora não",
        allowDeviceCredential: true,
        iosFallbackTitle: "Usar senha",
        androidTitle: "Ativar desbloqueio rápido",
        androidConfirmationRequired: false,
      });
      setBiometricEnrolled(true);
      setShow(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ativar");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="pointer-events-auto fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-3xl bg-white p-4 shadow-pop-lg ring-1 ring-cloud-deep/40 md:bottom-6"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          role="region"
          aria-label="Ativar desbloqueio biométrico"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky">
              <Fingerprint size={22} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-ink">Desbloqueio rápido</p>
              <p className="mt-0.5 text-xs leading-snug text-ink/70">
                Use Face ID ou Touch ID para entrar na próxima vez sem digitar a senha.
              </p>
              {error && (
                <p className="mt-2 text-xs font-bold text-alert">{error}</p>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/40 hover:bg-cloud-deep/15"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button onClick={enable} size="md" className="w-full" disabled={busy}>
              {busy ? "Ativando…" : "Ativar agora"}
            </Button>
            <Button onClick={dismiss} size="md" variant="outline" className="w-full" disabled={busy}>
              Agora não
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
