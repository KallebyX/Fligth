"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";

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
    const res = await onSubmit(question.id, selected);
    setSubmitting(false);
    setFeedback({
      correct: res.correct,
      correctChoice: res.correctChoice,
      explanation: res.explanation,
    });
    setPhase("feedback");
    sfx.play(res.correct ? "correct" : "wrong");
    onHearts?.(res.hearts);
  }

  function next() {
    onNext(feedback?.correct ?? false);
    setSelected(null);
    setFeedback(null);
    setPhase("answering");
  }

  const progressPct = Math.round(((index + 1) / total) * 100);

  return (
    <div className="flex min-h-[80vh] flex-col">
      <div className="container max-w-2xl flex-1 py-6">
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-cloud-deep/30">
          <div
            className="h-full bg-grass transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <h2 className="mb-6 text-xl font-extrabold leading-snug md:text-2xl">{question.stem}</h2>

        <motion.div
          key={question.id}
          animate={feedback?.correct === false ? { x: [-8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="grid gap-3"
        >
          {(["A", "B", "C", "D"] as ChoiceLetter[]).map((letter) => {
            const isSelected = selected === letter;
            const isCorrect = feedback?.correctChoice === letter;
            const isWrong = phase === "feedback" && isSelected && !feedback?.correct;
            const showCorrect = phase === "feedback" && isCorrect;

            return (
              <button
                key={letter}
                disabled={phase === "feedback"}
                onClick={() => setSelected(letter)}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-colors",
                  "bg-white",
                  isSelected && phase === "answering" && "border-sky bg-sky/5",
                  !isSelected && phase === "answering" && "border-cloud-deep hover:bg-cloud",
                  showCorrect && "border-grass bg-grass/10",
                  isWrong && "border-alert bg-alert/10",
                  phase === "feedback" && !showCorrect && !isWrong && "border-cloud-deep/40 opacity-60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-extrabold",
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
                <span className="text-base">{question.choices[letter]}</span>
              </button>
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
              "border-t-2 px-4 py-5",
              feedback.correct
                ? "border-grass bg-grass/10"
                : "border-alert bg-alert/10",
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
                    <p className="mt-1 text-sm text-ink/80">{feedback.explanation}</p>
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
        <div className="border-t border-cloud-deep/40 bg-white px-4 py-4">
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
