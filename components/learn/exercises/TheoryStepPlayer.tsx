"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import { ExerciseShell, type ExerciseShellFeedback } from "./ExerciseShell";
import { Markdown } from "@/components/ui/markdown";
import type { Exercise, PlayerProps } from "./types";
import { useSfx } from "@/components/learn/useSfx";
import { impact, notify } from "@/lib/haptics";

export function TheoryStepPlayer({
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
}: PlayerProps<Extract<Exercise, { kind: "theory_step" }>>) {
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [feedback, setFeedback] = useState<ExerciseShellFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sfx = useSfx();

  async function confirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(exercise.id, {});
      setFeedback({
        correct: res.correct,
        explanation: res.explanation,
      });
      setPhase("feedback");
      sfx.play("correct");
      void notify("success");
      void impact("light");
      onHearts?.(res.hearts);
    } catch {
      // Parent shows the error UI.
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    onNext(true, true);
    setFeedback(null);
    setPhase("answering");
  }

  return (
    <ExerciseShell
      total={total}
      index={index}
      phase={phase}
      feedback={feedback}
      canSubmit={true}
      submitting={submitting}
      onCheck={confirm}
      onNext={next}
      submitLabel="Entendi!"
      mascotOutfit={mascotOutfit}
      hearts={hearts}
      gems={gems}
      onAbandon={onAbandon}
      isPractice={isPractice}
    >
      <motion.div
        key={`theory-${exercise.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-sky">
          <BookOpen size={14} />
          <span>Mini-aula</span>
        </div>
        <h2 className="mb-1 text-[22px] font-extrabold leading-snug md:text-2xl">
          {exercise.payload.heading ?? exercise.stem}
        </h2>

        <div className="rounded-2xl border-2 border-sky/20 bg-sky/5 p-4 md:p-5">
          <Markdown
            content={exercise.payload.body_md}
            className="prose prose-sm max-w-none text-ink/90"
          />
        </div>

        <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-ink/55">
          <Sparkles size={14} className="text-sun" />
          Toque em &ldquo;Entendi!&rdquo; para continuar e ganhar XP.
        </p>
      </motion.div>
    </ExerciseShell>
  );
}
