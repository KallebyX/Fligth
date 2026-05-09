"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/client";

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
    <main className="container flex min-h-screen flex-col items-center justify-center py-12">
      <Mascot state="celebrate" size={120} />
      <Card className="mt-6 w-full max-w-md space-y-5">
        <CardTitle>Crie sua conta</CardTitle>
        <CardDesc>Comece a estudar agora — leva menos de 1 minuto.</CardDesc>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm font-bold text-alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-center text-sm text-ink/60">
          Já tem conta?{" "}
          <Link href="/login" className="font-bold text-sky">
            Entrar
          </Link>
        </p>
      </Card>
    </main>
  );
}
