"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuestionPlayer, type ChoiceLetter, type PlayerQuestion } from "@/components/learn/QuestionPlayer";
import { Mascot } from "@/components/mascot/Mascot";
import { submitAnswer } from "@/app/actions/submitAnswer";

export function ReviewRunner({ questions }: { questions: PlayerQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const current = questions[index];

  const handleSubmit = useMemo(
    () => async (questionId: number, choice: ChoiceLetter) => {
      const res = await submitAnswer({ questionId, choice, context: "review" });
      if (!res.ok) {
        return {
          correct: false,
          correctChoice: "A" as ChoiceLetter,
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
    if (index + 1 >= questions.length) {
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
          <Mascot state="celebrate" size={140} />
        </motion.div>
        <h1 className="text-3xl font-black">Revisão concluída!</h1>
        <p className="text-base text-ink/70">
          {correct} / {questions.length} corretas. As questões erradas voltarão depois — confia no
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
    <QuestionPlayer
      question={current}
      total={questions.length}
      index={index}
      onSubmit={handleSubmit}
      onNext={handleNext}
    />
  );
}
