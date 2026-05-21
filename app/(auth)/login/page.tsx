"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
        <main className="container py-12 text-center text-sm text-ink/50 dark:text-cloud/50">
          …
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
  const t = useTranslations("auth");

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
          <h1 className="mt-4 text-3xl font-black tracking-tight dark:text-cloud md:text-4xl">
            {t("loginPage.title")}
          </h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-cloud/60">
            {t("loginPage.subtitle")}
          </p>
        </div>

        <div className="card-pop space-y-4 p-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
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
                  {t("loginPage.submitting")}
                </>
              ) : (
                t("loginPage.submit")
              )}
            </Button>

            <Link
              href="/forgot-password"
              className="block text-center text-xs font-bold text-ink/55 hover:text-sky dark:text-cloud/55"
            >
              {t("loginPage.forgot")}
            </Link>
          </form>

          <OAuthButtons next={next} />
        </div>

        <p className="mt-5 text-center text-sm text-ink/60 dark:text-cloud/60">
          {t("loginPage.noAccount")}{" "}
          <Link href="/signup" className="font-extrabold text-sky hover:underline">
            {t("loginPage.signupCta")}
          </Link>
        </p>
      </div>
    </main>
  );
}
