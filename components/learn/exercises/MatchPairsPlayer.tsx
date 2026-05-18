"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExerciseShell, type ExerciseShellFeedback } from "./ExerciseShell";
import type { Exercise, PlayerProps } from "./types";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";
import { impact, notify } from "@/lib/haptics";
import { useReducedMotion } from "@/lib/motion";

function shuffleStable<T>(arr: T[], seed: number): T[] {
  let s = seed | 0 || 0x9876dcba;
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

type Match = { left: number; right: number };

export function MatchPairsPlayer({
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
}: PlayerProps<Extract<Exercise, { kind: "match_pairs" }>>) {
  // Right column rendered in randomised order so the player has to think;
  // left column stays in canonical order so it's predictable for screen
  // readers walking top-to-bottom.
  const rightOrder = useMemo(
    () =>
      shuffleStable(
        exercise.payload.pairs.map((_, i) => i),
        exercise.id,
      ),
    [exercise.id, exercise.payload.pairs],
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [feedback, setFeedback] = useState<ExerciseShellFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sfx = useSfx();
  const reducedMotion = useReducedMotion();

  const totalPairs = exercise.payload.pairs.length;
  const leftDone = new Set(matches.map((m) => m.left));
  const rightDone = new Set(matches.map((m) => m.right));

  function tapLeft(i: number) {
    if (phase !== "answering" || leftDone.has(i)) return;
    sfx.play("tap");
    void impact("light");
    if (selectedRight !== null) {
      setMatches([...matches, { left: i, right: selectedRight }]);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedLeft(selectedLeft === i ? null : i);
    }
  }

  function tapRight(i: number) {
    if (phase !== "answering" || rightDone.has(i)) return;
    sfx.play("tap");
    void impact("light");
    if (selectedLeft !== null) {
      setMatches([...matches, { left: selectedLeft, right: i }]);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedRight(selectedRight === i ? null : i);
    }
  }

  function clearMatch(left: number) {
    if (phase !== "answering") return;
    setMatches(matches.filter((m) => m.left !== left));
  }

  async function check() {
    if (matches.length !== totalPairs || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onSubmit(exercise.id, { matches });
      setFeedback({
        correct: res.correct,
        explanation: res.explanation,
      });
      setPhase("feedback");
      sfx.play(res.correct ? "correct" : "wrong");
      void notify(res.correct ? "success" : "warning");
      onHearts?.(res.hearts);
    } catch {
      setErrorMessage("Erro de conexão — tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    onNext(feedback?.correct ?? false);
    setMatches([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setFeedback(null);
    setPhase("answering");
  }

  return (
    <ExerciseShell
      total={total}
      index={index}
      phase={phase}
      feedback={feedback}
      canSubmit={matches.length === totalPairs}
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
        className="mb-2 text-[22px] font-extrabold leading-snug md:text-2xl"
      >
        {exercise.stem}
      </motion.h2>
      <p className="mb-5 text-sm text-ink/60">
        Toque em uma palavra à esquerda e outra à direita para conectar.
      </p>

      <motion.div
        animate={!reducedMotion && feedback && !feedback.correct ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="flex flex-col gap-2">
          {exercise.payload.pairs.map((p, i) => {
            const matched = leftDone.has(i);
            const selected = selectedLeft === i;
            const match = matches.find((m) => m.left === i);
            const showCorrect = phase === "feedback" && match?.right === i;
            const showWrong = phase === "feedback" && matched && match?.right !== i;
            return (
              <button
                key={`l-${i}`}
                onClick={() => (matched ? clearMatch(i) : tapLeft(i))}
                disabled={phase === "feedback"}
                aria-label={matched ? `Desfazer conexão de ${p.left}` : `Conectar ${p.left}`}
                aria-pressed={matched || selected}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className={cn(
                  "min-h-[56px] rounded-xl border-2 px-3 py-2 text-left text-sm font-extrabold leading-snug transition-colors touch-manipulation",
                  "bg-white",
                  selected && "border-sky bg-sky/10 text-sky",
                  matched && !selected && phase === "answering" && "border-grass bg-grass/10 text-grass",
                  !selected && !matched && phase === "answering" && "border-cloud-deep hover:bg-cloud",
                  showCorrect && "border-grass bg-grass/10 text-grass",
                  showWrong && "border-alert bg-alert/10 text-alert",
                  phase === "feedback" && !showCorrect && !showWrong && "opacity-60",
                )}
              >
                {p.left}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {rightOrder.map((i) => {
            const p = exercise.payload.pairs[i];
            const matched = rightDone.has(i);
            const selected = selectedRight === i;
            const match = matches.find((m) => m.right === i);
            const showCorrect = phase === "feedback" && match?.left === i;
            const showWrong = phase === "feedback" && matched && match?.left !== i;
            return (
              <button
                key={`r-${i}`}
                onClick={() => tapRight(i)}
                disabled={phase === "feedback" || matched}
                aria-label={`Conectar com ${p.right}`}
                aria-pressed={matched || selected}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className={cn(
                  "min-h-[56px] rounded-xl border-2 px-3 py-2 text-left text-sm font-extrabold leading-snug transition-colors touch-manipulation",
                  "bg-white",
                  selected && "border-sky bg-sky/10 text-sky",
                  matched && !selected && phase === "answering" && "border-grass bg-grass/10 text-grass opacity-70",
                  !selected && !matched && phase === "answering" && "border-cloud-deep hover:bg-cloud",
                  showCorrect && "border-grass bg-grass/10 text-grass",
                  showWrong && "border-alert bg-alert/10 text-alert",
                  phase === "feedback" && !showCorrect && !showWrong && "opacity-60",
                )}
              >
                {p.right}
              </button>
            );
          })}
        </div>
      </motion.div>

      {phase === "answering" && matches.length > 0 && matches.length < totalPairs && (
        <p className="mt-3 text-[11px] text-ink/40">
          {matches.length}/{totalPairs} pares conectados.
        </p>
      )}
    </ExerciseShell>
  );
}
