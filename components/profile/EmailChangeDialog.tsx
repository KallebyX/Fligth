"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { createClient } from "@/lib/supabase/client";
import { isEmail } from "@/lib/validators";

export function EmailChangeDialog({
  open,
  currentEmail,
  onClose,
}: {
  open: boolean;
  currentEmail: string | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const clean = email.trim().toLowerCase();
      if (!isEmail(clean)) {
        setError("Email inválido.");
        return;
      }
      if (clean === currentEmail?.toLowerCase()) {
        setError("Esse já é seu email atual.");
        return;
      }
      const supabase = createClient();
      const { error: e } = await supabase.auth.updateUser({ email: clean });
      if (e) {
        setError(e.message);
        return;
      }
      setSuccess(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Mudar email"
      maxWidth="max-w-md"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-sky/15 p-2 text-sky">
          <Mail size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-black dark:text-cloud">Mudar email</h2>
          <p className="text-xs text-ink/65 dark:text-cloud/65">
            Atual: <span className="font-bold">{currentEmail ?? "—"}</span>
          </p>
        </div>
      </div>

      {success ? (
        <div className="mt-5 rounded-2xl bg-grass/10 p-4">
          <p className="text-sm font-extrabold text-grass-deep">
            ✓ Pedido enviado
          </p>
          <p className="mt-1 text-xs leading-snug text-ink/70 dark:text-cloud/70">
            Enviamos um link de confirmação tanto para{" "}
            <strong>{currentEmail}</strong> quanto para{" "}
            <strong>{email}</strong>. Clique nos dois pra finalizar a troca.
            A mudança só vale quando ambos confirmam.
          </p>
          <Button
            size="md"
            variant="outline"
            className="mt-4 w-full"
            onClick={onClose}
          >
            Entendi
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/55 dark:text-cloud/55">
            Novo email
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@novo-email.com"
            className="w-full rounded-2xl border-2 border-cloud-deep bg-white px-3 py-2.5 text-sm font-bold text-ink outline-none ring-sky placeholder:text-ink/40 focus:border-sky focus:ring-2 dark:border-ink-light dark:bg-ink-mid dark:text-cloud dark:placeholder:text-cloud/40"
            autoFocus
          />
          {error && (
            <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
              {error}
            </p>
          )}
          <p className="text-[11px] leading-snug text-ink/55 dark:text-cloud/55">
            Por segurança, vamos te pedir confirmação no email atual{" "}
            <strong>e</strong> no novo. Os dois precisam clicar no link.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="md"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="md"
              variant="primary"
              className="flex-1"
              disabled={busy}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : "Enviar"}
            </Button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
