"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/button";
import { Gem, X } from "lucide-react";

const RARITY_BG: Record<string, string> = {
  common: "from-cloud to-cloud-deep/40",
  rare: "from-sky/30 to-sky/10",
  epic: "from-[#9333EA]/30 to-[#9333EA]/10",
  legendary: "from-gold/40 to-sun/20",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
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

export function OutfitRevealDialog({
  payload,
  onClose,
}: {
  payload: RevealPayload | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur"
        >
          <motion.div
            initial={{ scale: 0.6, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
            className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b ${
              RARITY_BG[payload.rarity] ?? RARITY_BG.common
            } p-6 text-center shadow-pop-lg`}
          >
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink/70 hover:bg-white"
            >
              <X size={18} />
            </button>

            <p className="text-[11px] font-bold uppercase tracking-widest text-ink/60">
              {payload.via === "jackpot" ? "Jackpot" : "Roleta"} ·{" "}
              {RARITY_LABEL[payload.rarity] ?? "Outfit"}
            </p>

            <h2 className="mt-1 text-2xl font-black text-ink">
              {payload.isDuplicate ? "Você já tinha esse!" : "Olha esse outfit!"}
            </h2>

            <div className="mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-full bg-white/80 shadow-pop">
              <Mascot state="celebrate" size={150} outfit={payload.outfitSlug} />
            </div>

            <p className="mt-3 text-lg font-extrabold text-ink">{payload.outfitName}</p>

            {payload.isDuplicate && (payload.gemsAwarded || payload.gemsRefunded) ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold text-sky-deep">
                <Gem size={14} className="text-sky" />+
                {payload.gemsAwarded ?? payload.gemsRefunded} gems devolvidos
              </p>
            ) : !payload.isDuplicate ? (
              <p className="mt-2 text-sm text-ink/70">
                Adicionado ao seu inventário. Equipe pelo perfil.
              </p>
            ) : null}

            <Button onClick={onClose} className="mt-5 w-full" size="lg">
              Show!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
