"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { ExerciseShell, type ExerciseShellFeedback } from "./ExerciseShell";
import type { Exercise, PlayerProps } from "./types";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";
import { impact, notify } from "@/lib/haptics";
import { useReducedMotion } from "@/lib/motion";

export function TrueFalsePlayer({
  exercise,
  total,
  index,
  onSubmit,
  onNext,
  onHearts,
}: PlayerProps<Extract<Exercise, { kind: "true_false" }>>) {
  const [pick, setPick] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [feedback, setFeedback] = useState<ExerciseShellFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sfx = useSfx();
  const reducedMotion = useReducedMotion();

  async function check() {
    if (pick == null || submitting) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(exercise.id, { bool: pick });
      setFeedback({
        correct: res.correct,
        explanation: res.explanation,
        correctLabel: exercise.payload.correct ? "Verdadeiro" : "Falso",
      });
      setPhase("feedback");
      sfx.play(res.correct ? "correct" : "wrong");
      void notify(res.correct ? "success" : "warning");
      onHearts?.(res.hearts);
    } catch {
      // Parent shows a full-screen error UI; we just stop the spinner.
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    onNext(feedback?.correct ?? false);
    setPick(null);
    setFeedback(null);
    setPhase("answering");
  }

  function choose(v: boolean) {
    if (phase !== "answering") return;
    setPick(v);
    sfx.play("tap");
    void impact("light");
  }

  return (
    <ExerciseShell
      total={total}
      index={index}
      phase={phase}
      feedback={feedback}
      canSubmit={pick !== null}
      submitting={submitting}
      onCheck={check}
      onNext={next}
    >
      <motion.h2
        key={`stem-${exercise.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-2 text-[22px] font-extrabold leading-snug md:text-2xl"
      >
        {exercise.stem}
      </motion.h2>
      <p className="mb-6 rounded-2xl bg-cloud px-4 py-3 text-base leading-snug text-ink/85 md:text-[17px]">
        {exercise.payload.statement}
      </p>

      <motion.div
        animate={!reducedMotion && feedback && !feedback.correct ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {[
          { v: true, label: "Verdadeiro", Icon: Check, color: "grass" },
          { v: false, label: "Falso", Icon: X, color: "alert" },
        ].map(({ v, label, Icon, color }) => {
          const selected = pick === v;
          const showCorrect = phase === "feedback" && exercise.payload.correct === v;
          const showWrong =
            phase === "feedback" && selected && exercise.payload.correct !== v;
          return (
            <button
              key={label}
              onClick={() => choose(v)}
              disabled={phase === "feedback"}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className={cn(
                "flex min-h-[88px] items-center justify-center gap-3 rounded-2xl border-2 p-4 text-lg font-extrabold transition-colors touch-manipulation",
                "bg-white",
                selected && phase === "answering" && "border-sky bg-sky/5",
                !selected && phase === "answering" && "border-cloud-deep hover:bg-cloud",
                showCorrect && "border-grass bg-grass/10 text-grass",
                showWrong && "border-alert bg-alert/10 text-alert",
                phase === "feedback" && !showCorrect && !showWrong && "border-cloud-deep/40 opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full",
                  color === "grass" ? "bg-grass/20 text-grass" : "bg-alert/20 text-alert",
                )}
              >
                <Icon size={26} />
              </span>
              {label}
            </button>
          );
        })}
      </motion.div>
    </ExerciseShell>
  );
}
