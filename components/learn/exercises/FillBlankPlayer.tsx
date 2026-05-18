"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ExerciseShell, type ExerciseShellFeedback } from "./ExerciseShell";
import type { Exercise, PlayerProps } from "./types";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";
import { impact, notify } from "@/lib/haptics";
import { useReducedMotion } from "@/lib/motion";

// Deterministic xorshift32 so the bank order is stable per question and
// can't be reshuffled by refreshing the page.
function shuffleStable<T>(arr: T[], seed: number): T[] {
  let s = seed | 0 || 0x1234abcd;
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function FillBlankPlayer({
  exercise,
  total,
  index,
  onSubmit,
  onNext,
  onHearts,
  mascotOutfit,
  hearts,
  gems,
  onAbandon,
  isPractice,
}: PlayerProps<Extract<Exercise, { kind: "fill_blank" }>>) {
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [feedback, setFeedback] = useState<ExerciseShellFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sfx = useSfx();
  const reducedMotion = useReducedMotion();
  const t = useTranslations("learn");

  // Bank order keyed by question id — same on every render for this question.
  const bankOrder = useMemo(
    () =>
      shuffleStable(
        exercise.payload.bank.map((_, i) => i),
        exercise.id,
      ),
    [exercise.id, exercise.payload.bank],
  );

  const segments = exercise.payload.template.split(/(\{0\})/g);

  async function check() {
    if (picked == null || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onSubmit(exercise.id, { fillIndex: picked });
      setFeedback({
        correct: res.correct,
        explanation: res.explanation,
        correctLabel: exercise.payload.bank[exercise.payload.answer],
      });
      setPhase("feedback");
      sfx.play(res.correct ? "correct" : "wrong");
      void notify(res.correct ? "success" : "warning");
      onHearts?.(res.hearts);
    } catch {
      setErrorMessage(t("transientError"));
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    onNext(feedback?.correct ?? false);
    setPicked(null);
    setFeedback(null);
    setPhase("answering");
  }

  return (
    <ExerciseShell
      total={total}
      index={index}
      phase={phase}
      feedback={feedback}
      canSubmit={picked !== null}
      submitting={submitting}
      onCheck={check}
      onNext={next}
      mascotOutfit={mascotOutfit}
      hearts={hearts}
      gems={gems}
      onAbandon={onAbandon}
      isPractice={isPractice}
      errorMessage={errorMessage}
    >
      <motion.h2
        key={`stem-${exercise.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6 text-[22px] font-extrabold leading-snug md:text-2xl"
      >
        {exercise.stem}
      </motion.h2>

      <motion.div
        animate={!reducedMotion && feedback && !feedback.correct ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border-2 border-cloud-deep bg-white p-4 text-lg leading-relaxed md:text-xl"
      >
        {segments.map((seg, i) =>
          seg === "{0}" ? (
            <span
              key={i}
              className={cn(
                "mx-1 inline-flex min-w-[80px] items-center justify-center rounded-lg border-2 border-dashed px-3 py-1 text-base font-extrabold align-baseline",
                picked == null
                  ? "border-cloud-deep bg-cloud text-ink/40"
                  : phase === "feedback"
                    ? feedback?.correct
                      ? "border-grass bg-grass/10 text-grass border-solid"
                      : "border-alert bg-alert/10 text-alert border-solid"
                    : "border-sky bg-sky/10 text-sky border-solid",
              )}
            >
              {picked != null ? exercise.payload.bank[picked] : "____"}
            </span>
          ) : (
            <span key={i}>{seg}</span>
          ),
        )}
      </motion.div>

      <p className="mt-6 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/55">
        Banco de palavras
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {bankOrder.map((bankIdx) => {
          const word = exercise.payload.bank[bankIdx];
          const selected = picked === bankIdx;
          const showCorrect =
            phase === "feedback" && bankIdx === exercise.payload.answer;
          const showWrong = phase === "feedback" && selected && !feedback?.correct;
          return (
            <button
              key={bankIdx}
              onClick={() => {
                if (phase !== "answering") return;
                setPicked(bankIdx);
                sfx.play("tap");
                void impact("light");
              }}
              disabled={phase === "feedback"}
              aria-label={`Preencher com ${word}`}
              aria-pressed={selected}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className={cn(
                "min-h-[48px] rounded-xl border-2 px-3 py-2 text-sm font-extrabold transition-colors touch-manipulation",
                "bg-white",
                selected && phase === "answering" && "border-sky bg-sky/10 text-sky",
                !selected && phase === "answering" && "border-cloud-deep hover:bg-cloud",
                showCorrect && "border-grass bg-grass/10 text-grass",
                showWrong && "border-alert bg-alert/10 text-alert",
                phase === "feedback" && !showCorrect && !showWrong && "opacity-50",
              )}
            >
              {word}
            </button>
          );
        })}
      </div>
    </ExerciseShell>
  );
}
