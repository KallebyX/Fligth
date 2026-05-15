"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // The Supabase email link will hit /callback with a recovery code;
      // callback exchanges it for a session and forwards to /reset-password.
      redirectTo: `${window.location.origin}/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="rounded-full bg-sky/10 p-2 ring-4 ring-sky/15">
            <Mascot state={sent ? "celebrate" : "happy"} size={128} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            {sent ? "Email enviado!" : "Esqueceu a senha?"}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {sent
              ? "Confira sua caixa de entrada. O link expira em 1 hora."
              : "Te mandamos um link pra criar uma nova."}
          </p>
        </div>

        <div className="card-pop space-y-4 p-5">
          {sent ? (
            <div className="flex items-start gap-3 rounded-2xl bg-grass/10 p-4 text-sm">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-grass" />
              <div>
                <p className="font-bold text-grass-deep">Tudo certo.</p>
                <p className="mt-1 text-ink/70">
                  Procure por um email do Supabase Auth e clique no link.
                  Não recebeu? Verifique o spam ou tente outro email.
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Email da conta
                </label>
                <Input
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1"
                />
              </div>
              {error && (
                <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Enviando…
                  </>
                ) : (
                  "Enviar link"
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-ink/60">
          Lembrou?{" "}
          <Link href="/login" className="font-extrabold text-sky hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
