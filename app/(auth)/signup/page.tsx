"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="rounded-full bg-grass/10 p-2 ring-4 ring-grass/20">
            <Mascot state="celebrate" size={128} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Comece de graça
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Crie sua conta e prepare-se pra prova teórica da ANAC.
          </p>
        </div>

        <div className="card-pop space-y-4 p-5">
          <ul className="space-y-2 text-sm text-ink/80">
            {[
              "Trilhas das 5 matérias oficiais",
              "Simulado completo 100q × 3h",
              "XP, ofensiva e ranking semanal",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-grass" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <form className="space-y-3 pt-2" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Email
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
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Senha (mín. 6)
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
            {error && (
              <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Criando…
                </>
              ) : (
                "Criar conta grátis"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink/60">
          Já tem conta?{" "}
          <Link href="/login" className="font-extrabold text-sky hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
