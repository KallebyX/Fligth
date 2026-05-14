"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExercisePlayer } from "@/components/learn/ExercisePlayer";
import type { Exercise, ExerciseSubmission } from "@/components/learn/exercises/types";
import { LessonCompleteScreen } from "@/components/learn/LessonCompleteScreen";
import { AbandonDialog } from "@/components/learn/AbandonDialog";
import { submitAnswer } from "@/app/actions/submitAnswer";
import { completeLesson } from "@/app/actions/completeLesson";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";

export type LessonRunnerProps = {
  lessonId: number;
  exercises: Exercise[];
  initialHearts: number;
  initialGems: number;
  mascotOutfit: string | null;
};

export function LessonRunner({
  lessonId,
  exercises,
  initialHearts,
  initialGems,
  mascotOutfit,
}: LessonRunnerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [theoryCount, setTheoryCount] = useState(0);
  const [hearts, setHearts] = useState(initialHearts);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAbandon, setShowAbandon] = useState(false);
  const [completion, setCompletion] = useState<{
    xpAwarded: number;
    perfect: boolean;
    newStreak: number;
    theoryCount: number;
  } | null>(null);

  const current = exercises[index];

  const hasMixedKinds = useMemo(
    () => exercises.some((e) => e.kind !== "multiple_choice"),
    [exercises],
  );

  const handleSubmit = useMemo(
    () => async (questionId: number, submission: ExerciseSubmission) => {
      try {
        const res = await submitAnswer({
          questionId,
          choice: submission.choice,
          response: {
            matches: submission.matches,
            fillIndex: submission.fillIndex,
            bool: submission.bool,
            order: submission.order,
          },
          context: "lesson",
          wasFirstTry: true,
        });
        if (!res.ok) {
          setError(`Não consegui validar sua resposta (${res.error}). Tente recarregar a página.`);
          throw new Error(res.error);
        }
        return res;
      } catch (err) {
        throw err;
      }
    },
    [],
  );

  async function handleNext(correct: boolean, isTheory?: boolean) {
    const newCorrect = correctCount + (correct ? 1 : 0);
    const newTheory = theoryCount + (isTheory ? 1 : 0);
    setCorrectCount(newCorrect);
    setTheoryCount(newTheory);

    if (hearts === 0) {
      router.push("/learn?out=hearts");
      return;
    }

    if (index + 1 >= exercises.length) {
      const res = await completeLesson({
        lessonId,
        correctCount: newCorrect,
        theoryCount: newTheory,
        totalCount: exercises.length,
        hasMixedKinds,
      });
      if (res.ok) {
        setCompletion({
          xpAwarded: res.xpAwarded,
          perfect: res.perfect,
          newStreak: res.newStreak,
          theoryCount: res.theoryCount,
        });
        setDone(true);
      } else {
        setError(
          `Concluí as questões mas não consegui salvar o progresso (${res.error}). Recarregue a página.`,
        );
      }
      return;
    }

    setIndex(index + 1);
  }

  if (done && completion) {
    return (
      <LessonCompleteScreen
        xpAwarded={completion.xpAwarded}
        perfect={completion.perfect}
        newStreak={completion.newStreak}
        hearts={hearts}
        theoryCount={completion.theoryCount}
      />
    );
  }

  if (error) {
    return (
      <main className="container flex min-h-[70vh] flex-col items-center justify-center gap-5 py-12 text-center">
        <Mascot state="sad" size={120} outfit={mascotOutfit} />
        <h2 className="text-2xl font-black">Algo deu errado</h2>
        <p className="max-w-md text-sm text-ink/70">{error}</p>
        <div className="flex gap-2">
          <Button onClick={() => location.reload()}>Recarregar</Button>
          <Button variant="outline" onClick={() => router.push("/learn")}>
            Voltar
          </Button>
        </div>
      </main>
    );
  }

  if (!current) return null;

  return (
    <>
      <ExercisePlayer
        exercise={current}
        total={exercises.length}
        index={index}
        onSubmit={handleSubmit}
        onNext={handleNext}
        onHearts={setHearts}
        mascotOutfit={mascotOutfit}
        hearts={hearts}
        gems={initialGems}
        onAbandon={() => setShowAbandon(true)}
      />
      <AbandonDialog
        open={showAbandon}
        onCancel={() => setShowAbandon(false)}
        onConfirm={() => router.push("/learn")}
      />
    </>
  );
}
