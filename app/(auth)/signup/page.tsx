"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/mascot/Mascot";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    // Forward the referral code (if any) through the email confirmation
    // round-trip so the callback can attach it once the session exists.
    const refParam = new URLSearchParams(window.location.search).get("ref");
    const refSuffix = refParam ? `&ref=${encodeURIComponent(refParam)}` : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/callback?next=/onboarding${refSuffix}`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If Supabase email confirmation is enabled (default), the user must
    // click the link before getting a session. Show a confirmation screen.
    // If confirmation is OFF, `data.session` is present and we route straight.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto rounded-full bg-grass/10 p-2 ring-4 ring-grass/20">
            <Mascot state="celebrate" size={128} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Confirme seu email</h1>
          <p className="mt-2 text-sm text-ink/65">
            Enviamos um link de ativação para{" "}
            <strong className="text-ink">{sentTo}</strong>. Abra o email e
            clique no botão para entrar na conta.
          </p>

          <div className="card-pop mt-5 flex items-start gap-3 p-4 text-left text-sm">
            <MailCheck size={20} className="mt-0.5 shrink-0 text-grass" />
            <div>
              <p className="font-bold text-ink">Não chegou em 1 minuto?</p>
              <p className="mt-0.5 text-ink/65">
                Verifique a pasta de spam ou tente outro endereço.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setSentTo(null)}
          >
            Usar outro email
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="rounded-full bg-grass/10 p-2 ring-4 ring-grass/20">
            <Mascot state="celebrate" size={128} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight dark:text-cloud md:text-4xl">
            {t("signupPage.title")}
          </h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-cloud/60">
            {t("signupPage.subtitle")}
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
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-cloud/60">
                {t("email")}
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
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-cloud/60">
                {t("password")}
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
                  {t("signupPage.submitting")}
                </>
              ) : (
                t("signupPage.submit")
              )}
            </Button>
          </form>

          <OAuthButtons next="/onboarding" />
        </div>

        <p className="mt-5 text-center text-sm text-ink/60 dark:text-cloud/60">
          {t("signupPage.haveAccount")}{" "}
          <Link href="/login" className="font-extrabold text-sky hover:underline">
            {t("signupPage.loginCta")}
          </Link>
        </p>
      </div>
    </main>
  );
}
