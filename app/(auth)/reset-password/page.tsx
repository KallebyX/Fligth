"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // The /callback already exchanged the recovery code for a session before
  // routing here. Confirm there's an active session — if not, the link
  // expired or was used already.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthorized(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/learn");
    router.refresh();
  }

  if (authorized === false) {
    return (
      <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto rounded-full bg-alert/10 p-2 ring-4 ring-alert/15">
            <Mascot state="sad" size={120} />
          </div>
          <h1 className="mt-4 text-2xl font-black">Link expirado</h1>
          <p className="mt-1 text-sm text-ink/60">
            Este link de recuperação não é mais válido. Peça um novo.
          </p>
          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => router.push("/forgot-password")}
          >
            Pedir novo link
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="rounded-full bg-sky/10 p-2 ring-4 ring-sky/15">
            <Mascot state="happy" size={128} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Nova senha
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Crie uma nova senha forte para sua conta.
          </p>
        </div>

        <div className="card-pop space-y-4 p-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Nova senha (mín. 6)
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Confirmar
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="mt-1"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading || authorized === null}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Salvando…
                </>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
