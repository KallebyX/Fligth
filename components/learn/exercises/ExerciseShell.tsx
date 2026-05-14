"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Gem, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

export type ExerciseShellPhase = "answering" | "feedback";

export type ExerciseShellFeedback = {
  correct: boolean;
  explanation: string | null;
  // For MCQ we surface the right letter ("A".."D"). Other kinds either show
  // the correct option visually or omit this string entirely.
  correctLabel?: string;
};

export function ExerciseShell({
  total,
  index,
  phase,
  feedback,
  canSubmit,
  submitting,
  onCheck,
  onNext,
  submitLabel = "Verificar",
  continueLabel = "Continuar",
  children,
  mascotOutfit,
  hearts,
  gems,
  onAbandon,
}: {
  total: number;
  index: number;
  phase: ExerciseShellPhase;
  feedback: ExerciseShellFeedback | null;
  canSubmit: boolean;
  submitting: boolean;
  onCheck: () => void;
  onNext: () => void;
  submitLabel?: string;
  continueLabel?: string;
  children: ReactNode;
  mascotOutfit?: string | null;
  hearts?: number;
  gems?: number;
  onAbandon?: () => void;
}) {
  const progressPct = Math.round(((index + 1) / total) * 100);
  const showChrome = onAbandon != null || hearts != null || gems != null;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div
        className="sticky top-0 z-10 bg-cloud/95 backdrop-blur supports-[backdrop-filter]:bg-cloud/70"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container flex max-w-2xl items-center gap-2 px-3 pb-1.5 pt-2 sm:px-4">
          {onAbandon && (
            <button
              type="button"
              onClick={onAbandon}
              aria-label="Sair da lição"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/55 hover:bg-cloud-deep/15"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <X size={22} />
            </button>
          )}
          <div className="flex-1">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-cloud-deep/30"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da lição"
            >
              <div
                className="h-full bg-grass transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          {hearts != null && (
            <span
              className="flex h-9 items-center gap-1 rounded-full bg-alert/10 px-2.5 text-sm font-extrabold text-alert tabular-nums"
              aria-label={`${hearts} vidas restantes`}
            >
              <Heart size={16} fill="currentColor" />
              {hearts}
            </span>
          )}
          {gems != null && (
            <span
              className="hidden h-9 items-center gap-1 rounded-full bg-sun/15 px-2.5 text-sm font-extrabold text-sun tabular-nums sm:flex"
              aria-label={`${gems} gemas`}
            >
              <Gem size={16} />
              {gems}
            </span>
          )}
        </div>
        {!showChrome && (
          <div className="container max-w-2xl px-4 pb-1 pt-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink/55">
              Questão {index + 1} de {total}
            </div>
          </div>
        )}
      </div>

      <div className="container max-w-2xl flex-1 px-4 pb-40 pt-4">{children}</div>

      <AnimatePresence>
        {phase === "feedback" && feedback && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={cn(
              "fixed inset-x-0 bottom-0 z-20 border-t-2 px-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
              feedback.correct
                ? "border-grass bg-grass/10 backdrop-blur"
                : "border-alert bg-alert/10 backdrop-blur",
            )}
          >
            <div className="container max-w-2xl">
              <div className="flex items-start gap-4">
                <Mascot
                  state={feedback.correct ? "celebrate" : "sad"}
                  size={64}
                  outfit={mascotOutfit ?? null}
                />
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-lg font-extrabold",
                      feedback.correct ? "text-grass" : "text-alert",
                    )}
                  >
                    {feedback.correct
                      ? "Mandou bem!"
                      : feedback.correctLabel
                        ? `Resposta certa: ${feedback.correctLabel}.`
                        : "Não foi dessa vez."}
                  </p>
                  {feedback.explanation && (
                    <Markdown content={feedback.explanation} className="mt-1 text-sm text-ink/80" />
                  )}
                </div>
              </div>
              <Button size="lg" className="mt-4 w-full" onClick={onNext}>
                {continueLabel}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "answering" && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cloud-deep/40 bg-white/95 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="container max-w-2xl">
            <Button
              size="lg"
              className="w-full"
              onClick={onCheck}
              disabled={!canSubmit || submitting}
              variant={canSubmit ? "primary" : "outline"}
            >
              {submitting ? "Conferindo..." : submitLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
