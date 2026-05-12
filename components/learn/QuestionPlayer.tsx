"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";
import { impact, notify } from "@/lib/haptics";

export type ChoiceLetter = "A" | "B" | "C" | "D";

export type PlayerQuestion = {
  id: number;
  stem: string;
  choices: Record<ChoiceLetter, string>;
};

export type SubmitFn = (
  questionId: number,
  choice: ChoiceLetter,
) => Promise<{
  correct: boolean;
  correctChoice: ChoiceLetter;
  explanation: string | null;
  hearts: number;
}>;

type Phase = "answering" | "feedback";

export function QuestionPlayer({
  question,
  total,
  index,
  onSubmit,
  onNext,
  onHearts,
}: {
  question: PlayerQuestion;
  total: number;
  index: number;
  onSubmit: SubmitFn;
  onNext: (correct: boolean) => void;
  onHearts?: (h: number) => void;
}) {
  const [selected, setSelected] = useState<ChoiceLetter | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctChoice: ChoiceLetter;
    explanation: string | null;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sfx = useSfx();

  async function check() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(question.id, selected);
      setFeedback({
        correct: res.correct,
        correctChoice: res.correctChoice,
        explanation: res.explanation,
      });
      setPhase("feedback");
      sfx.play(res.correct ? "correct" : "wrong");
      void notify(res.correct ? "success" : "warning");
      onHearts?.(res.hearts);
    } catch {
      // Parent (LessonRunner) shows a full-screen error UI; just stop the spinner.
    } finally {
      setSubmitting(false);
    }
  }

  function pick(letter: ChoiceLetter) {
    setSelected(letter);
    sfx.play("tap");
    void impact("light");
  }

  function next() {
    onNext(feedback?.correct ?? false);
    setSelected(null);
    setFeedback(null);
    setPhase("answering");
  }

  const progressPct = Math.round(((index + 1) / total) * 100);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Sticky progress + counter */}
      <div className="sticky top-0 z-10 bg-cloud/95 backdrop-blur supports-[backdrop-filter]:bg-cloud/70">
        <div className="container max-w-2xl px-4 pb-2 pt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink/60">
            <span>Questão {index + 1} de {total}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-cloud-deep/30">
            <div
              className="h-full bg-grass transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container max-w-2xl flex-1 px-4 pb-40 pt-4">
        <motion.h2
          key={`stem-${question.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6 text-[22px] font-extrabold leading-snug md:text-2xl"
        >
          {question.stem}
        </motion.h2>

        <motion.div
          key={question.id}
          animate={feedback?.correct === false ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="grid gap-3 select-none"
        >
          {(["A", "B", "C", "D"] as ChoiceLetter[]).map((letter, idx) => {
            const isSelected = selected === letter;
            const isCorrect = feedback?.correctChoice === letter;
            const isWrong = phase === "feedback" && isSelected && !feedback?.correct;
            const showCorrect = phase === "feedback" && isCorrect;

            return (
              <motion.button
                key={`${question.id}-${letter}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                whileTap={phase === "answering" ? { scale: 0.97 } : {}}
                disabled={phase === "feedback"}
                onClick={() => pick(letter)}
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
                <span className="text-base leading-snug md:text-[17px]">{question.choices[letter]}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {phase === "feedback" && feedback && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
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
                />
                <div className="flex-1">
                  <p className={cn("text-lg font-extrabold", feedback.correct ? "text-grass" : "text-alert")}>
                    {feedback.correct ? "Mandou bem!" : `A resposta certa era ${feedback.correctChoice}.`}
                  </p>
                  {feedback.explanation && (
                    <Markdown content={feedback.explanation} className="mt-1 text-sm text-ink/80" />
                  )}
                </div>
              </div>
              <Button size="lg" className="mt-4 w-full" onClick={next}>
                Continuar
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
              onClick={check}
              disabled={!selected || submitting}
              variant={selected ? "primary" : "outline"}
            >
              {submitting ? "Conferindo..." : "Verificar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// re-export Card to silence "unused" if any future need.
void Card;
