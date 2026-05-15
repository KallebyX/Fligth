"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/mascot/Mascot";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="container py-12 text-center text-sm text-ink/50">
          Carregando…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/learn";
  const callbackError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(callbackError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="rounded-full bg-sky/10 p-2 ring-4 ring-sky/15">
            <Mascot state="happy" size={128} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Bem-vindo de volta!
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Entre na sua conta para continuar voando.
          </p>
        </div>

        <div className="card-pop space-y-4 p-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
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
                Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <Link
              href="/forgot-password"
              className="block text-center text-xs font-bold text-ink/55 hover:text-sky"
            >
              Esqueci minha senha
            </Link>
          </form>

          <OAuthButtons next={next} />
        </div>

        <p className="mt-5 text-center text-sm text-ink/60">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="font-extrabold text-sky hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </main>
  );
}
