"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

  async function finish() {
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
    router.push("/learn");
  }

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center py-12">
      <Mascot state="happy" size={120} />
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
            <Button size="lg" className="w-full" onClick={finish} disabled={saving}>
              {saving ? "Salvando..." : "Decolar"}
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}
