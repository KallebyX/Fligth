"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { Gem, Sparkles, Trophy, X } from "lucide-react";
import { getDivision } from "@/lib/leagues/divisions";
import { notify } from "@/lib/haptics";
import { useSfx } from "@/components/learn/useSfx";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

function useWindowSize() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export type Promotion = {
  id: number;
  from: string | null;
  to: string;
  rank: number | null;
  gems: number | null;
  outfit: { slug: string; name: string } | null;
};

export function LevelUpDialog({ promo }: { promo: Promotion | null }) {
  const { w, h } = useWindowSize();
  const sfx = useSfx();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!promo) return;
    const key = `lori.seen.league_promoted_${promo.id}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
      setOpen(true);
      sfx.play("lesson-complete");
      void notify("success");
    } catch {
      setOpen(true);
    }
  }, [promo, sfx]);

  if (!promo) return null;
  const division = getDivision(promo.to);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/65 p-4 backdrop-blur"
        >
          {w > 0 && (
            <Confetti
              width={w}
              height={h}
              numberOfPieces={260}
              recycle={false}
              gravity={0.22}
              colors={[division.color, "#FBBF24", "#10B981", "#0EA5E9", "#A78BFA"]}
            />
          )}

          <motion.div
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 text-center shadow-pop-lg"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cloud text-ink/70 hover:bg-cloud-deep/30"
            >
              <X size={18} />
            </button>

            <div
              className="-mx-6 -mt-6 px-6 pb-5 pt-7 text-white"
              style={{ backgroundColor: division.color }}
            >
              <div className="mx-auto mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                <Trophy size={12} />
                Promoção
              </div>
              <h2 className="text-3xl font-black leading-tight">
                Voou pra {division.name}!
              </h2>
              <p className="mt-1 text-sm font-bold uppercase tracking-wider opacity-85">
                Tier {division.tier} · #{promo.rank ?? "?"} da liga anterior
              </p>
            </div>

            <div className="mx-auto -mt-4 mb-3 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-pop">
              <Mascot state="celebrate" size={120} outfit={promo.outfit?.slug} />
            </div>

            <div className="space-y-2">
              {promo.gems != null && promo.gems > 0 && (
                <div className="card-pop flex items-center justify-between gap-2 bg-sky/5 p-3 text-left">
                  <span className="flex items-center gap-2 text-sm font-bold text-ink/70">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky/15 text-sky-deep">
                      <Gem size={16} />
                    </span>
                    Gems ganhos
                  </span>
                  <span className="text-lg font-black text-sky-deep">+{promo.gems}</span>
                </div>
              )}
              {promo.outfit && (
                <div className="card-pop flex items-center justify-between gap-2 bg-gold/5 p-3 text-left">
                  <span className="flex items-center gap-2 text-sm font-bold text-ink/70">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
                      <Sparkles size={16} />
                    </span>
                    Outfit raro
                  </span>
                  <span className="text-sm font-extrabold text-ink">{promo.outfit.name}</span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={() => setOpen(false)}
              className="mt-5 w-full"
              style={{ backgroundColor: division.color }}
            >
              Continuar voando
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
