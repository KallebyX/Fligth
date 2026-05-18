"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ExerciseShell, type ExerciseShellFeedback } from "./ExerciseShell";
import type { ChoiceLetter, Exercise, PlayerProps } from "./types";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";
import { impact, notify } from "@/lib/haptics";
import { useReducedMotion } from "@/lib/motion";

export function MultipleChoicePlayer({
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
}: PlayerProps<Extract<Exercise, { kind: "multiple_choice" }>>) {
  const [selected, setSelected] = useState<ChoiceLetter | null>(null);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [feedback, setFeedback] = useState<ExerciseShellFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sfx = useSfx();
  const reducedMotion = useReducedMotion();
  const t = useTranslations("learn");

  async function check() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onSubmit(exercise.id, { choice: selected });
      setFeedback({
        correct: res.correct,
        explanation: res.explanation,
        correctLabel: res.correctChoice,
      });
      setPhase("feedback");
      sfx.play(res.correct ? "correct" : "wrong");
      void notify(res.correct ? "success" : "warning");
      onHearts?.(res.hearts);
    } catch {
      // Server-side error (network blip, transient_failure from submitAnswer).
      // Keep the selection intact so the user can hit Verificar again.
      setErrorMessage(t("transientError"));
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    onNext(feedback?.correct ?? false);
    setSelected(null);
    setFeedback(null);
    setPhase("answering");
  }

  function pick(letter: ChoiceLetter) {
    if (phase !== "answering") return;
    setSelected(letter);
    sfx.play("tap");
    void impact("light");
  }

  return (
    <ExerciseShell
      total={total}
      index={index}
      phase={phase}
      feedback={feedback}
      canSubmit={selected !== null}
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
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6 text-[22px] font-extrabold leading-snug md:text-2xl"
      >
        {exercise.stem}
      </motion.h2>

      <motion.div
        key={exercise.id}
        animate={
          !reducedMotion && feedback?.correct === false
            ? { x: [-10, 10, -8, 8, -4, 4, 0] }
            : {}
        }
        transition={{ duration: 0.5 }}
        className="grid select-none gap-3"
      >
        {(["A", "B", "C", "D"] as ChoiceLetter[]).map((letter, idx) => {
          const isSelected = selected === letter;
          const isCorrect = feedback?.correctLabel === letter;
          const isWrong = phase === "feedback" && isSelected && !feedback?.correct;
          const showCorrect = phase === "feedback" && isCorrect;

          return (
            <motion.button
              key={`${exercise.id}-${letter}`}
              initial={reducedMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: reducedMotion ? 0 : idx * 0.05 }}
              whileTap={phase === "answering" ? { scale: 0.97 } : {}}
              disabled={phase === "feedback"}
              onClick={() => pick(letter)}
              aria-label={`Opção ${letter}: ${exercise.choices[letter]}`}
              aria-pressed={isSelected}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className={cn(
                "flex min-h-[64px] items-center gap-4 rounded-2xl border-2 p-4 text-left touch-manipulation transition-colors",
                "bg-white active:scale-[0.99]",
                isSelected && phase === "answering" && "border-sky bg-sky/5",
                !isSelected && phase === "answering" && "border-cloud-deep hover:bg-cloud hover:-translate-y-px",
                showCorrect && "border-grass bg-grass/10",
                isWrong && "border-alert bg-alert/10",
                phase === "feedback" && !showCorrect && !isWrong && "border-cloud-deep/40 opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold transition-colors",
                  showCorrect
                    ? "bg-grass text-white"
                    : isWrong
                      ? "bg-alert text-white"
                      : isSelected
                        ? "bg-sky text-white"
                        : "bg-cloud text-ink/70",
                )}
              >
                {letter}
              </span>
              <span className="text-base leading-snug md:text-[17px]">{exercise.choices[letter]}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </ExerciseShell>
  );
}
