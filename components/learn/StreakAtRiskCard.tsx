"use client";

import { useState, useTransition } from "react";
import { Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redeemStreakFreeze } from "@/app/actions/streakFreeze";

export function StreakAtRiskCard({
  streak,
  freezes,
}: {
  streak: number;
  freezes: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(false);

  function onUseFreeze() {
    setError(null);
    startTransition(async () => {
      const result = await redeemStreakFreeze();
      if (result.ok) {
        setUsed(true);
      } else {
        setError(
          result.error === "no_freezes"
            ? "Você não tem mais escudos. Faça uma lição pra manter."
            : result.error === "already_active_today"
              ? "Você já treinou hoje — streak salvo automaticamente."
              : "Não foi possível usar o escudo. Tente de novo.",
        );
      }
    });
  }

  if (used) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-3xl border-2 border-sky/40 bg-sky/10 p-4">
        <Snowflake size={24} className="shrink-0 text-sky-deep" />
        <p className="flex-1 text-sm font-bold text-sky-deep">
          Escudo de gelo usado. Sua ofensiva de {streak} dia{streak === 1 ? "" : "s"}{" "}
          está protegida hoje. ❄️
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-3xl border-2 border-sun/60 bg-gradient-to-br from-sun/15 to-gold/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun/25">
          <Flame size={28} className="fill-sun text-sun" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-sun">
            Ofensiva em risco
          </p>
          <h3 className="mt-0.5 text-base font-black leading-snug">
            Sua sequência de {streak} dia{streak === 1 ? "" : "s"} está prestes a quebrar.
          </h3>
          <p className="mt-1 text-sm leading-snug text-ink/70">
            Faça uma lição agora pra manter, ou use um escudo de gelo
            (você tem {freezes}).
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="md"
          variant="primary"
          className="flex-1"
          onClick={() => {
            window.location.href = "/learn#first-available";
          }}
        >
          <Flame size={16} />
          Continuar lição
        </Button>
        <Button
          size="md"
          variant="outline"
          className="flex-1 border-sky text-sky-deep"
          onClick={onUseFreeze}
          disabled={pending}
        >
          <Snowflake size={16} />
          Usar escudo ({freezes})
        </Button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
