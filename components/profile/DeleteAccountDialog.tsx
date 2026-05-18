"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { deleteAccount } from "@/app/actions/deleteAccount";
import { setBiometricEnrolled } from "@/components/auth/BiometricGate";

const CONFIRM_PHRASE = "EXCLUIR MINHA CONTA";

export function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await deleteAccount({ confirmText });
      if (!res.ok) {
        setError(
          res.error === "confirm_text_mismatch"
            ? `Digite exatamente "${CONFIRM_PHRASE}" para confirmar.`
            : res.error,
        );
        return;
      }
      setBiometricEnrolled(false);
      router.push("/?deleted=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "delete_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => !busy && onClose()}
      ariaLabel="Excluir conta"
      maxWidth="max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-alert/15 text-alert">
          <AlertTriangle size={22} />
        </span>
        <div className="flex-1">
          <h2 className="text-lg font-black text-ink dark:text-cloud">
            Excluir conta?
          </h2>
          <p className="mt-1 text-sm leading-snug text-ink/70 dark:text-cloud/70">
            Vai apagar permanentemente seu perfil, ofensiva, XP, vidas,
            outfits comprados e todo seu progresso. Essa ação não pode
            ser desfeita.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-bold uppercase tracking-wider text-ink/55 dark:text-cloud/55">
          Digite{" "}
          <code className="rounded bg-cloud px-1.5 py-0.5 font-mono text-alert dark:bg-ink-deep/40">
            {CONFIRM_PHRASE}
          </code>{" "}
          para confirmar
        </label>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          className="mt-1"
          disabled={busy}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button
          onClick={() => !busy && onClose()}
          size="md"
          variant="outline"
          className="w-full"
          disabled={busy}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          size="md"
          variant="danger"
          className="w-full"
          disabled={busy || confirmText !== CONFIRM_PHRASE}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : "Excluir tudo"}
        </Button>
      </div>
    </BottomSheet>
  );
}
