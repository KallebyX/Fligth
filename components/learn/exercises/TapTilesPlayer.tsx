"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft } from "lucide-react";
import { ExerciseShell, type ExerciseShellFeedback } from "./ExerciseShell";
import type { Exercise, PlayerProps } from "./types";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";
import { impact, notify } from "@/lib/haptics";
import { useReducedMotion } from "@/lib/motion";

function shuffleStable<T>(arr: T[], seed: number): T[] {
  let s = seed | 0 || 0x4321feed;
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

export function TapTilesPlayer({
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
}: PlayerProps<Extract<Exercise, { kind: "tap_tiles" }>>) {
  const tileOrder = useMemo(
    () =>
      shuffleStable(
        exercise.payload.words.map((_, i) => i),
        exercise.id,
      ),
    [exercise.id, exercise.payload.words],
  );

  const [picked, setPicked] = useState<number[]>([]);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [feedback, setFeedback] = useState<ExerciseShellFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sfx = useSfx();
  const reducedMotion = useReducedMotion();

  const totalTiles = exercise.payload.words.length;
  const remaining = tileOrder.filter((i) => !picked.includes(i));

  async function check() {
    if (picked.length !== totalTiles || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onSubmit(exercise.id, { order: picked });
      const correctSentence = exercise.payload.correct
        .map((i) => exercise.payload.words[i])
        .join(" ");
      setFeedback({
        correct: res.correct,
        explanation: res.explanation,
        correctLabel: correctSentence,
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
    setPicked([]);
    setFeedback(null);
    setPhase("answering");
  }

  function pickTile(i: number) {
    if (phase !== "answering" || picked.includes(i)) return;
    setPicked([...picked, i]);
    sfx.play("tap");
    void impact("light");
  }

  function unpick(i: number) {
    if (phase !== "answering") return;
    setPicked(picked.filter((p) => p !== i));
    sfx.play("tap");
  }

  function undo() {
    if (phase !== "answering" || picked.length === 0) return;
    setPicked(picked.slice(0, -1));
    sfx.play("tap");
    void impact("light");
  }

  return (
    <ExerciseShell
      total={total}
      index={index}
      phase={phase}
      feedback={feedback}
      canSubmit={picked.length === totalTiles}
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
        className="min-h-[80px] rounded-2xl border-2 border-dashed border-cloud-deep bg-white p-3"
      >
        <AnimatePresence initial={false}>
          <div className="flex flex-wrap gap-2">
            {picked.length === 0 && (
              <span className="text-sm text-ink/40">Toque nos blocos abaixo para montar.</span>
            )}
            {picked.map((i) => (
              <motion.button
                key={`picked-${i}`}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => unpick(i)}
                disabled={phase === "feedback"}
                aria-label={`Remover ${exercise.payload.words[i]}`}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm font-extrabold touch-manipulation",
                  phase === "feedback"
                    ? feedback?.correct
                      ? "border-grass bg-grass/10 text-grass"
                      : "border-alert bg-alert/10 text-alert"
                    : "border-sky bg-sky/10 text-sky hover:bg-sky/15",
                )}
              >
                {exercise.payload.words[i]}
              </motion.button>
            ))}
          </div>
        </AnimatePresence>
      </motion.div>

      <p className="mt-4 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink/55">
        <span>Blocos</span>
        <button
          type="button"
          onClick={undo}
          disabled={picked.length === 0 || phase !== "answering"}
          className="inline-flex items-center gap-1 rounded-full border border-cloud-deep px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink/60 hover:bg-cloud disabled:opacity-40"
        >
          <CornerDownLeft size={12} /> Apagar
        </button>
      </p>

      <div className="flex flex-wrap gap-2">
        {tileOrder.map((i) => {
          const used = picked.includes(i);
          return (
            <button
              key={`tile-${i}`}
              onClick={() => pickTile(i)}
              disabled={used || phase === "feedback"}
              aria-label={used ? `${exercise.payload.words[i]} já usado` : `Adicionar ${exercise.payload.words[i]}`}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className={cn(
                "min-h-[48px] rounded-xl border-2 px-3 py-2 text-sm font-extrabold transition-colors touch-manipulation",
                used
                  ? "border-cloud-deep bg-cloud text-ink/20"
                  : "border-cloud-deep bg-white hover:bg-cloud",
              )}
            >
              {exercise.payload.words[i]}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-ink/40">
        {remaining.length === 0
          ? "Tudo posicionado — toque em Verificar."
          : `Faltam ${remaining.length} bloco${remaining.length === 1 ? "" : "s"}.`}
      </p>
    </ExerciseShell>
  );
}
