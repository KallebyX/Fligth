"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExercisePlayer } from "@/components/learn/ExercisePlayer";
import type { Exercise, ExerciseSubmission } from "@/components/learn/exercises/types";
import { Mascot } from "@/components/mascot/Mascot";
import { submitAnswer } from "@/app/actions/submitAnswer";

export function ReviewRunner({
  exercises,
  mascotOutfit,
}: {
  exercises: Exercise[];
  mascotOutfit?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const current = exercises[index];

  const handleSubmit = useMemo(
    () => async (questionId: number, submission: ExerciseSubmission) => {
      const res = await submitAnswer({
        questionId,
        choice: submission.choice,
        response: {
          matches: submission.matches,
          fillIndex: submission.fillIndex,
          bool: submission.bool,
          order: submission.order,
        },
        context: "review",
      });
      if (!res.ok) {
        return {
          correct: false,
          correctChoice: "A" as const,
          explanation: "Erro: " + res.error,
          hearts: 5,
        };
      }
      return res;
    },
    [],
  );

  function handleNext(wasCorrect: boolean) {
    if (wasCorrect) setCorrect((c) => c + 1);
    if (index + 1 >= exercises.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
  }

  if (done) {
    return (
      <main className="container flex min-h-[80vh] flex-col items-center justify-center gap-6 py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
        >
          <Mascot state="celebrate" size={140} outfit={mascotOutfit} />
        </motion.div>
        <h1 className="text-3xl font-black">Revisão concluída!</h1>
        <p className="text-base text-ink/70">
          {correct} / {exercises.length} corretas. As questões erradas voltarão depois — confia no
          processo.
        </p>
        <Link href="/learn">
          <Button size="lg">Voltar às trilhas</Button>
        </Link>
      </main>
    );
  }

  if (!current) return null;

  return (
    <ExercisePlayer
      exercise={current}
      total={exercises.length}
      index={index}
      onSubmit={handleSubmit}
      onNext={handleNext}
      mascotOutfit={mascotOutfit ?? null}
    />
  );
}
