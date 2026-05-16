"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { useReducedMotion } from "@/lib/motion";

export function AbandonDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="abandon-title"
        >
          <motion.div
            initial={reducedMotion ? { y: 0 } : { y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="w-full max-w-sm rounded-t-[28px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6 shadow-soft-lg ring-1 ring-cloud-deep/30 sm:rounded-[28px] sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <Mascot state="sad" size={64} />
              <div className="flex-1">
                <h2 id="abandon-title" className="text-lg font-black text-ink">
                  Sair da lição?
                </h2>
                <p className="mt-1 text-sm leading-snug text-ink/70">
                  Você vai perder o progresso e XP desta sessão. As vidas
                  perdidas continuam descontadas.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="primary" onClick={onCancel} size="md" className="w-full">
                Continuar lição
              </Button>
              <Button variant="outline" onClick={onConfirm} size="md" className="w-full">
                Sair mesmo assim
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
