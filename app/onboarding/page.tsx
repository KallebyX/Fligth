"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  AtSign,
  BarChart3,
  Heart,
  Loader2,
  Sparkles,
  Timer,
} from "lucide-react";

const GOALS = [
  { value: 10, label: "5 minutos por dia", desc: "Bem leve", time: "5min" },
  { value: 20, label: "10 minutos por dia", desc: "Padrão", time: "10min" },
  { value: 30, label: "15 minutos por dia", desc: "Sério", time: "15min" },
  { value: 50, label: "30 minutos por dia", desc: "Insano", time: "30min" },
];

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [goal, setGoal] = useState(20);
  const [saving, setSaving] = useState(false);

  function validateUsername(value: string): string | null {
    const v = value.trim().toLowerCase();
    if (v.length < 3) return "Mínimo 3 caracteres.";
    if (v.length > 20) return "Máximo 20 caracteres.";
    if (!/^[a-z0-9_]+$/.test(v))
      return "Apenas letras minúsculas, números e _.";
    return null;
  }

  function tryNextStep0() {
    const err = validateUsername(username);
    setUsernameError(err);
    if (err) return;
    setStep(1);
  }

  async function persistAndAdvance(toPaywall = false) {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const cleanUsername = username.trim().toLowerCase();
    // Auto-populate display_name from the OAuth provider's metadata
    // (Google sends `name`, `full_name` or `display_name`; Apple sends `name`).
    // This is only used if the profile didn't already have one set.
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const oauthName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      (typeof meta.display_name === "string" && meta.display_name) ||
      null;
    const oauthPicture =
      (typeof meta.picture === "string" && meta.picture) ||
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      null;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const baseUpdate: {
      username: string | null;
      daily_goal_xp: number;
      display_name?: string;
      avatar_url?: string;
    } = {
      username: cleanUsername || null,
      daily_goal_xp: goal,
    };
    if (oauthName && !existingProfile?.display_name) {
      baseUpdate.display_name = oauthName;
    }
    if (oauthPicture && !existingProfile?.avatar_url) {
      baseUpdate.avatar_url = oauthPicture;
    }
    const updates = baseUpdate;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setUsernameError(
        /duplicate key|profiles_username_lower_idx/i.test(error.message)
          ? "Esse @ já está em uso. Tente outro."
          : error.message,
      );
      setStep(0);
      return;
    }
    if (toPaywall) setStep(2);
    else router.push("/learn?welcome=1");
  }

  return (
    <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-10 bg-sky" : i < step ? "w-6 bg-sky/70" : "w-6 bg-cloud-deep/40",
              )}
            />
          ))}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-sky/10 p-2 ring-4 ring-sky/15">
            <Mascot
              state={step === 2 ? "celebrate" : "happy"}
              size={128}
            />
          </div>
        </div>

        <div className="card-pop mt-5 space-y-4 p-5">
          {step === 0 && (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-black">Como podemos te chamar?</h2>
                <p className="mt-1 text-sm text-ink/60">
                  Esse @ aparece no ranking semanal e no seu perfil público.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Seu @
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/40">
                    <AtSign size={16} />
                  </span>
                  <Input
                    placeholder="capitao_lori"
                    value={username}
                    onChange={(e) => {
                      const v = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "");
                      setUsername(v);
                      if (usernameError) setUsernameError(null);
                    }}
                    maxLength={20}
                    autoFocus
                    className="pl-9"
                  />
                </div>
                {usernameError && (
                  <p className="mt-2 text-sm font-bold text-alert">
                    {usernameError}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-ink/50">
                  3–20 caracteres. Letras minúsculas, números e _ apenas.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={tryNextStep0}
                disabled={!username.trim()}
              >
                Continuar
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-black">Qual sua meta diária?</h2>
                <p className="mt-1 text-sm text-ink/60">
                  Você pode mudar depois. O segredo é constância, não maratona.
                </p>
              </div>

              <div className="grid gap-2">
                {GOALS.map((g) => {
                  const active = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors",
                        active
                          ? "border-sky bg-sky/10 shadow-pop"
                          : "border-cloud-deep bg-white hover:bg-cloud/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          active ? "bg-sky text-white" : "bg-cloud text-ink/70",
                        )}
                      >
                        <Timer size={18} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-extrabold">{g.label}</span>
                        <span className="block text-xs text-ink/60">{g.desc}</span>
                      </span>
                      <span
                        className={cn(
                          "font-black tabular-nums",
                          active ? "text-sky" : "text-ink/60",
                        )}
                      >
                        {g.value} XP
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => persistAndAdvance(true)}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Salvando…
                    </>
                  ) : (
                    "Continuar"
                  )}
                </Button>
                <Button
                  size="md"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep(0)}
                  disabled={saving}
                >
                  Voltar
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-black">Última coisa</h2>
                <p className="mt-1 text-sm text-ink/60">
                  <strong>7 dias grátis</strong> do Capitão Lorí Pro. Cancele a
                  qualquer momento, sem cobrança no trial.
                </p>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-alert/15 text-alert">
                    <Heart size={16} />
                  </span>
                  Vidas ilimitadas — sem parar no meio
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky/15 text-sky-deep">
                    <BarChart3 size={16} />
                  </span>
                  Estatísticas detalhadas dos seus erros
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Sparkles size={16} />
                  </span>
                  Outfit Pro Dourado + simulados extras
                </li>
              </ul>

              <div className="grid gap-2 pt-2">
                <Link href="/pro">
                  <Button size="lg" variant="warn" className="w-full">
                    Começar 7 dias grátis
                  </Button>
                </Link>
                <Button
                  size="md"
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/learn")}
                >
                  Continuar grátis por enquanto
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
