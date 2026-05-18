"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpinningWheel } from "@/components/shop/SpinningWheel";
import { spinRouletteAction } from "@/app/actions/outfits";
import { impact, notify } from "@/lib/haptics";
import { useSfx } from "@/components/learn/useSfx";
import {
  OutfitRevealDialog,
  type RevealPayload,
} from "@/components/shop/OutfitRevealDialog";
import { CooldownClock } from "@/components/shop/CooldownClock";

export function RoulettePanel({
  initialNextSpinAt,
}: {
  initialNextSpinAt: string | null;
}) {
  const router = useRouter();
  const sfx = useSfx();
  const [nextAt, setNextAt] = useState<string | null>(initialNextSpinAt);
  const [spinning, start] = useTransition();
  const [spinAngle, setSpinAngle] = useState(0);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready =
    !nextAt || new Date(nextAt).getTime() <= Date.now();

  function spin() {
    if (!ready || spinning) return;
    void impact("medium");
    sfx.play("tap");
    setError(null);
    // Multiple full rotations + random landing angle for visual drama.
    setSpinAngle((a) => a + 1800 + Math.floor(Math.random() * 360));
    start(async () => {
      const res = await spinRouletteAction();
      if (!res.ok) {
        void notify("error");
        setError(
          res.error === "cooldown_active"
            ? "Aguarde o cooldown para girar de novo."
            : "Não rolou agora. Tenta de novo em instantes.",
        );
        if (res.nextSpinAt) setNextAt(res.nextSpinAt);
        return;
      }
      sfx.play(res.isDuplicate ? "streak" : "level-up");
      void notify("success");
      setNextAt(res.nextSpinAt);
      setReveal({
        outfitSlug: res.outfit.slug,
        outfitName: res.outfit.name,
        rarity: res.outfit.rarity,
        isDuplicate: res.isDuplicate,
        gemsAwarded: res.gemsAwarded,
        via: "roulette",
      });
    });
  }

  function closeReveal() {
    setReveal(null);
    router.refresh();
  }

  return (
    <>
      <div className="card-pop overflow-hidden">
        <div className="grid gap-4 p-5 sm:grid-cols-[auto,1fr] sm:items-center">
          <div className="flex justify-center">
            <SpinningWheel
              variant="roulette"
              spinAngle={spinAngle}
              spinning={spinning}
              outfit="sunset-shades"
              size={180}
            />
          </div>
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-grass/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-grass-deep">
              <Sparkles size={12} />
              Grátis · 1×/dia
            </p>
            <h3 className="mt-2 text-xl font-black dark:text-cloud">Roleta diária</h3>
            <p className="mt-1 text-sm text-ink/70 dark:text-cloud/70">
              Cada giro entrega um outfit{" "}
              <strong className="text-ink dark:text-cloud">comum</strong> ou{" "}
              <strong className="text-ink dark:text-cloud">raro</strong>. Repetiu? Você ganha 20
              gems de consolação.
            </p>
            <p className="mt-2 text-xs text-ink/60 dark:text-cloud/60">
              {ready ? (
                <span className="font-extrabold text-grass">
                  Disponível agora
                </span>
              ) : (
                <>
                  Próximo giro em{" "}
                  <CooldownClock
                    nextAt={nextAt}
                    onReady={() => setNextAt(null)}
                  />
                </>
              )}
            </p>
            <Button
              size="lg"
              variant={ready ? "primary" : "outline"}
              disabled={!ready || spinning}
              onClick={spin}
              className="mt-3 w-full"
            >
              {spinning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Girando…
                </>
              ) : ready ? (
                <>
                  <Sparkles size={18} />
                  Girar grátis
                </>
              ) : (
                "Aguarde o cooldown"
              )}
            </Button>
            {error && (
              <p className="mt-2 text-xs font-bold text-alert">{error}</p>
            )}
          </div>
        </div>
      </div>

      <OutfitRevealDialog payload={reveal} onClose={closeReveal} />
    </>
  );
}
