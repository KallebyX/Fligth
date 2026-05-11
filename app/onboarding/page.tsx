"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Heart, Sparkles, BarChart3 } from "lucide-react";

const GOALS = [
  { value: 10, label: "5 minutos por dia", desc: "Bem leve" },
  { value: 20, label: "10 minutos por dia", desc: "Padrão" },
  { value: 30, label: "15 minutos por dia", desc: "Sério" },
  { value: 50, label: "30 minutos por dia", desc: "Insano" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [goal, setGoal] = useState(20);
  const [saving, setSaving] = useState(false);

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
    await supabase
      .from("profiles")
      .update({ username: username || null, daily_goal_xp: goal })
      .eq("id", user.id);
    setSaving(false);
    if (toPaywall) setStep(2);
    else router.push("/learn");
  }

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center py-12">
      <Mascot state={step === 2 ? "celebrate" : "happy"} size={120} />

      <Card className="mt-6 w-full max-w-md space-y-5">
        {step === 0 && (
          <>
            <CardTitle>Como podemos te chamar?</CardTitle>
            <CardDesc>Esse nome aparece no ranking semanal das ligas.</CardDesc>
            <Input
              placeholder="Seu callsign aqui (ex.: PT-LORI)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={24}
              autoFocus
            />
            <Button size="lg" className="w-full" onClick={() => setStep(1)} disabled={!username.trim()}>
              Continuar
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <CardTitle>Qual sua meta diária?</CardTitle>
            <CardDesc>Você pode mudar depois. O segredo é constância, não maratona.</CardDesc>
            <div className="grid gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-colors",
                    goal === g.value ? "border-sky bg-sky/10" : "border-cloud-deep bg-white",
                  )}
                >
                  <span>
                    <span className="block font-extrabold">{g.label}</span>
                    <span className="block text-xs text-ink/60">{g.desc}</span>
                  </span>
                  <span className="font-extrabold text-sky">{g.value} XP</span>
                </button>
              ))}
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => persistAndAdvance(true)}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Continuar"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <CardTitle>Última coisa: leve o app a sério</CardTitle>
            <CardDesc>
              <strong>7 dias grátis</strong> do Capitão Lorí Pro — vidas ilimitadas, simulados
              extras e estatísticas. Cancele a qualquer momento, sem cobrança no trial.
            </CardDesc>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Heart size={16} className="text-alert" />
                Vidas ilimitadas — sem parar no meio
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 size={16} className="text-sky" />
                Estatísticas detalhadas dos seus erros
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={16} className="text-gold" />
                Simulados extras + sem anúncios
              </li>
            </ul>

            <div className="grid gap-2">
              <Link href="/pro">
                <Button size="lg" className="w-full">
                  Começar 7 dias grátis
                </Button>
              </Link>
              <Button
                size="lg"
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/learn")}
              >
                Continuar grátis por enquanto
              </Button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
