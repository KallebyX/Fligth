"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Gem, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpinningWheel } from "@/components/shop/SpinningWheel";
import { spinJackpotAction } from "@/app/actions/outfits";
import { impact, notify } from "@/lib/haptics";
import { useSfx } from "@/components/learn/useSfx";
import { JACKPOT_COST_GEMS } from "@/lib/outfits/constants";
import {
  OutfitRevealDialog,
  type RevealPayload,
} from "@/components/shop/OutfitRevealDialog";
import { CooldownClock } from "@/components/shop/CooldownClock";

export function JackpotPanel({
  initialGems,
  initialNextAt,
}: {
  initialGems: number;
  initialNextAt: string | null;
}) {
  const router = useRouter();
  const sfx = useSfx();
  const [gems, setGems] = useState(initialGems);
  const [nextAt, setNextAt] = useState<string | null>(initialNextAt);
  const [spinning, start] = useTransition();
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [spinAngle, setSpinAngle] = useState(0);

  const cooldownReady =
    !nextAt || new Date(nextAt).getTime() <= Date.now();
  const canAfford = gems >= JACKPOT_COST_GEMS;
  const ready = cooldownReady && canAfford;

  function spin() {
    if (!ready || spinning) return;
    void impact("heavy");
    sfx.play("level-up");
    setError(null);
    // Jackpot spins MORE rotations than the daily roulette for extra drama.
    setSpinAngle((a) => a + 2520 + Math.floor(Math.random() * 360));
    start(async () => {
      const res = await spinJackpotAction();
      if (!res.ok) {
        void notify("error");
        if (res.error === "not_enough_gems")
          setError(`Faltam ${JACKPOT_COST_GEMS - gems} gems pra girar.`);
        else if (res.error === "cooldown_active")
          setError("Cooldown ativo — espera passar.");
        else setError("Não rolou agora. Tenta de novo.");
        if (res.nextSpinAt) setNextAt(res.nextSpinAt);
        return;
      }
      sfx.play(res.isDuplicate ? "streak" : "lesson-complete");
      void notify("success");
      setGems(res.gemsBalance);
      setNextAt(res.nextSpinAt);
      setReveal({
        outfitSlug: res.outfit.slug,
        outfitName: res.outfit.name,
        rarity: res.outfit.rarity,
        isDuplicate: res.isDuplicate,
        gemsRefunded: res.gemsRefunded,
        via: "jackpot",
      });
    });
  }

  function closeReveal() {
    setReveal(null);
    router.refresh();
  }

  return (
    <>
      <div className="card-pop overflow-hidden bg-gradient-to-br from-gold/15 to-sun/15">
        <div className="grid gap-4 p-5 sm:grid-cols-[auto,1fr] sm:items-center">
          <div className="flex justify-center">
            <SpinningWheel
              variant="jackpot"
              spinAngle={spinAngle}
              spinning={spinning}
              outfit="diamante-jacket"
              size={200}
            />
          </div>
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
              <Crown size={12} />
              Épicos e lendários
            </p>
            <h3 className="mt-2 text-xl font-black">Jackpot</h3>
            <p className="mt-1 text-sm text-ink/70">
              Cada giro custa{" "}
              <strong className="text-ink">{JACKPOT_COST_GEMS} gems</strong> e
              entrega outfits <strong className="text-ink">épicos</strong> ou{" "}
              <strong className="text-ink">lendários</strong>. Cooldown: 1h.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/70">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-extrabold">
                <Gem size={12} className="text-sky" />
                {gems}
              </span>
              {!cooldownReady ? (
                <span>
                  Próximo em{" "}
                  <CooldownClock
                    nextAt={nextAt}
                    onReady={() => setNextAt(null)}
                  />
                </span>
              ) : !canAfford ? (
                <span className="font-extrabold text-alert">
                  Sem gems suficientes
                </span>
              ) : (
                <span className="font-extrabold text-grass">Pronto pra girar</span>
              )}
            </div>
            <Button
              size="lg"
              variant={ready ? "warn" : "outline"}
              disabled={!ready || spinning}
              onClick={spin}
              className="mt-3 w-full"
            >
              {spinning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Girando…
                </>
              ) : (
                <>
                  <Crown size={18} />
                  Girar por {JACKPOT_COST_GEMS} gems
                </>
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
