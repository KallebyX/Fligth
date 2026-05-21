"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";

// Card rico mostrado em /learn?out=hearts quando o usuário ficou sem vidas.
// Conta regressiva live até a próxima vida + 2 CTAs (Pro / recarregar gems).
export function HeartsOutCard({
  heartsRegenAt,
  hearts,
}: {
  heartsRegenAt: string | null;
  hearts: number;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!heartsRegenAt) {
      setSecondsLeft(null);
      return;
    }
    const target = new Date(heartsRegenAt).getTime();
    const update = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [heartsRegenAt]);

  const showCountdown = heartsRegenAt && secondsLeft != null && secondsLeft > 0;
  const minutes = Math.floor((secondsLeft ?? 0) / 60);
  const seconds = (secondsLeft ?? 0) % 60;
  const fmt = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border-2 border-alert/40 bg-gradient-to-br from-alert/5 to-alert/15 p-5">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="shrink-0">
          <Mascot state="sad" size={88} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-alert/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-alert">
            <Heart size={12} fill="currentColor" />
            Sem vidas
          </div>
          <h2 className="mt-2 text-xl font-black text-ink md:text-2xl">
            Você ficou sem vidas
          </h2>
          {showCountdown ? (
            <p className="mt-1 text-sm leading-snug text-ink/70">
              Sua próxima vida volta em{" "}
              <strong className="font-extrabold tabular-nums text-alert">{fmt}</strong>.
              Você está com {hearts} de 5.
            </p>
          ) : secondsLeft === 0 ? (
            <p className="mt-1 text-sm leading-snug text-ink/70">
              Sua vida acabou de voltar! Recarregue a página.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-snug text-ink/70">
              Volta uma vida a cada 30 minutos, até no máximo 5.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link href="/pro">
          <Button size="md" variant="warn" className="w-full">
            <Crown size={16} />
            Vidas infinitas com Pro
          </Button>
        </Link>
        <Link href="/shop">
          <Button size="md" variant="outline" className="w-full">
            <Zap size={16} />
            Recarregar agora
          </Button>
        </Link>
      </div>
    </div>
  );
}
