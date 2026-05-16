"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/button";
import { Gem, Sparkles, X } from "lucide-react";
import { impact } from "@/lib/haptics";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

// Rarity backgrounds: richer saturation for legendary/epic so the win
// actually feels rare. Common stays muted (it's, well, common).
const RARITY_BG: Record<string, string> = {
  common:    "from-cloud to-cloud-deep/40",
  rare:      "from-sky/40 to-sky/10",
  epic:      "from-[#A855F7]/45 to-[#A855F7]/10",
  legendary: "from-gold/60 to-sun/30",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const RARITY_RING: Record<string, string> = {
  common:    "ring-cloud-deep",
  rare:      "ring-sky",
  epic:      "ring-[#A855F7]",
  legendary: "ring-gold",
};

const CONFETTI_COLORS: Record<string, string[]> = {
  common:    ["#CBD5E1", "#94A3B8", "#E2E8F0"],
  rare:      ["#0EA5E9", "#38BDF8", "#7DD3FC", "#FFFFFF"],
  epic:      ["#A855F7", "#C084FC", "#E9D5FF", "#FFFFFF"],
  legendary: ["#FBBF24", "#F59E0B", "#FCD34D", "#FDE68A", "#FFFFFF"],
};

export type RevealPayload = {
  outfitSlug: string;
  outfitName: string;
  rarity: string;
  isDuplicate: boolean;
  gemsAwarded?: number;
  gemsRefunded?: number;
  via: "roulette" | "jackpot";
};

function useWindowSize() {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export function OutfitRevealDialog({
  payload,
  onClose,
}: {
  payload: RevealPayload | null;
  onClose: () => void;
}) {
  const { w, h } = useWindowSize();
  const [confettiRunning, setConfettiRunning] = useState(false);

  useEffect(() => {
    if (!payload) return;
    // Bigger payoff = stronger haptic. Legendary gets the iOS heavy thud.
    const intensity =
      payload.rarity === "legendary" || payload.rarity === "epic"
        ? "heavy"
        : payload.rarity === "rare"
          ? "medium"
          : "light";
    void impact(intensity);
    // Confetti only fires for genuine rare+ wins (not duplicates, not common).
    const showConfetti =
      !payload.isDuplicate &&
      (payload.rarity === "rare" ||
        payload.rarity === "epic" ||
        payload.rarity === "legendary");
    setConfettiRunning(showConfetti);
    const t = window.setTimeout(() => setConfettiRunning(false), 3000);
    return () => window.clearTimeout(t);
  }, [payload]);

  const colors = payload
    ? CONFETTI_COLORS[payload.rarity] ?? CONFETTI_COLORS.common
    : CONFETTI_COLORS.common;
  const showConfetti = confettiRunning && w > 0 && payload && !payload.isDuplicate;

  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          key={payload.outfitSlug}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur"
          onClick={(e) => {
            // Click on backdrop closes — but not when clicking the card.
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {showConfetti && (
            <Confetti
              width={w}
              height={h}
              numberOfPieces={
                payload.rarity === "legendary"
                  ? 320
                  : payload.rarity === "epic"
                    ? 220
                    : 140
              }
              recycle={confettiRunning}
              gravity={0.22}
              colors={colors}
            />
          )}

          <motion.div
            initial={{ scale: 0.7, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 24, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
              mass: 0.8,
            }}
            className={`relative w-full max-w-sm overflow-hidden rounded-[28px] bg-gradient-to-b ${
              RARITY_BG[payload.rarity] ?? RARITY_BG.common
            } p-6 text-center shadow-pop-lg`}
          >
            {/* Soft halo glow for legendary/epic */}
            {(payload.rarity === "legendary" || payload.rarity === "epic") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.55, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`pointer-events-none absolute -inset-10 -z-0 rounded-full blur-3xl ${
                  payload.rarity === "legendary"
                    ? "bg-gold/40"
                    : "bg-[#A855F7]/35"
                }`}
              />
            )}

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink/70 transition-colors hover:bg-white"
            >
              <X size={18} />
            </button>

            <motion.p
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="relative text-[11px] font-bold uppercase tracking-widest text-ink/60"
            >
              {payload.via === "jackpot" ? "Jackpot" : "Roleta"}
            </motion.p>

            <motion.h2
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 240, damping: 18 }}
              className="relative mt-1 text-2xl font-black text-ink"
            >
              {payload.isDuplicate ? "Você já tinha esse!" : "Olha esse outfit!"}
            </motion.h2>

            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                delay: 0.32,
                type: "spring",
                stiffness: 180,
                damping: 14,
              }}
              className={`relative mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-full bg-white/85 shadow-pop ring-4 ${
                RARITY_RING[payload.rarity] ?? RARITY_RING.common
              }`}
            >
              {/* Sparkle on legendary */}
              {payload.rarity === "legendary" && !payload.isDuplicate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: [0, 20, -20, 0] }}
                  transition={{ delay: 0.5, duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-2 -top-2 text-gold"
                >
                  <Sparkles size={28} className="fill-gold" />
                </motion.div>
              )}
              <Mascot state="celebrate" size={150} outfit={payload.outfitSlug} />
            </motion.div>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="relative mt-4 text-lg font-extrabold text-ink"
            >
              {payload.outfitName}
            </motion.p>

            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 16 }}
              className={`relative mt-2 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-widest ${
                payload.rarity === "legendary"
                  ? "bg-gold/30 text-gold"
                  : payload.rarity === "epic"
                    ? "bg-[#A855F7]/25 text-[#7E22CE]"
                    : payload.rarity === "rare"
                      ? "bg-sky/25 text-sky-deep"
                      : "bg-cloud-deep/40 text-ink/70"
              }`}
            >
              {RARITY_LABEL[payload.rarity] ?? "Outfit"}
            </motion.span>

            {payload.isDuplicate && (payload.gemsAwarded || payload.gemsRefunded) ? (
              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="relative mt-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-sm font-extrabold text-sky-deep"
              >
                <Gem size={14} className="text-sky" />+
                {payload.gemsAwarded ?? payload.gemsRefunded} gems devolvidos
              </motion.p>
            ) : !payload.isDuplicate ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.3 }}
                className="relative mt-3 text-sm text-ink/70"
              >
                Adicionado ao seu inventário. Equipe pelo perfil.
              </motion.p>
            ) : null}

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.3 }}
              className="relative"
            >
              <Button onClick={onClose} className="mt-5 w-full" size="lg">
                Show!
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
