"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileCompletionResult } from "@/lib/profileCompletion";
import { claimCompleteProfileReward } from "@/app/actions/claimCompleteProfileReward";

export function CompletionMeter({
  completion,
  alreadyClaimed,
}: {
  completion: ProfileCompletionResult;
  alreadyClaimed: boolean;
}) {
  const [claimed, setClaimed] = useState(alreadyClaimed);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isComplete = completion.pct >= 100;
  const ringColor =
    completion.pct >= 100
      ? "stroke-grass"
      : completion.pct >= 60
        ? "stroke-sun"
        : "stroke-sky";

  function claim() {
    setError(null);
    start(async () => {
      const result = await claimCompleteProfileReward();
      if (result.ok) {
        setClaimed(true);
      } else {
        setError(
          result.error === "already_claimed"
            ? "Você já recebeu esse bônus."
            : result.error === "not_complete"
              ? "Complete todos os campos primeiro."
              : "Não foi possível resgatar. Tente novamente.",
        );
      }
    });
  }

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (completion.pct / 100) * circumference;

  return (
    <div className="card-pop overflow-hidden p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width={80} height={80} viewBox="0 0 80 80" aria-hidden>
            <circle
              cx={40}
              cy={40}
              r={radius}
              strokeWidth={8}
              className="fill-none stroke-cloud-deep/40"
            />
            <motion.circle
              cx={40}
              cy={40}
              r={radius}
              strokeWidth={8}
              strokeLinecap="round"
              className={`fill-none transition-colors ${ringColor}`}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "40px 40px",
              }}
              initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
              animate={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black tabular-nums">
              {completion.pct}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink/55">
              completo
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold">
            {isComplete ? "Perfil completo!" : "Complete seu perfil"}
          </h3>
          <p className="mt-0.5 text-xs leading-snug text-ink/65">
            {isComplete
              ? claimed
                ? "Tudo certo. Você já resgatou o bônus."
                : "Você ganhou 50 gemas de bônus. Resgate aí em baixo."
              : "Perfis completos aparecem melhor no ranking e ganham 50 gemas."}
          </p>
        </div>
      </div>

      {!isComplete && completion.missing.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {completion.missing.map((m) => (
            <li
              key={m.key}
              className="rounded-full bg-cloud px-3 py-1 text-[11px] font-bold text-ink/65"
            >
              {m.label}
            </li>
          ))}
        </ul>
      )}

      {isComplete && !claimed && (
        <div className="mt-4">
          <Button
            size="md"
            variant="primary"
            className="w-full bg-grass hover:bg-grass-deep"
            onClick={claim}
            disabled={pending}
          >
            <Sparkles size={16} />
            {pending ? "Resgatando…" : "Resgatar 50 gemas"}
          </Button>
          {error && (
            <p className="mt-2 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
              {error}
            </p>
          )}
        </div>
      )}

      {isComplete && claimed && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-grass/10 px-3 py-1 text-xs font-bold text-grass-deep">
          <Check size={14} />
          Bônus de 50 gemas recebido
        </p>
      )}
    </div>
  );
}
