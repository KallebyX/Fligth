"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionPlayer, type ChoiceLetter, type PlayerQuestion } from "@/components/learn/QuestionPlayer";
import { LessonCompleteScreen } from "@/components/learn/LessonCompleteScreen";
import { submitAnswer } from "@/app/actions/submitAnswer";
import { completeLesson } from "@/app/actions/completeLesson";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";

export type LessonRunnerProps = {
  lessonId: number;
  questions: PlayerQuestion[];
};

export function LessonRunner({ lessonId, questions }: LessonRunnerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<{
    xpAwarded: number;
    perfect: boolean;
    newStreak: number;
  } | null>(null);

  const current = questions[index];

  const handleSubmit = useMemo(
    () => async (questionId: number, choice: ChoiceLetter) => {
      try {
        const res = await submitAnswer({ questionId, choice, context: "lesson", wasFirstTry: true });
        if (!res.ok) {
          setError(`Não consegui validar sua resposta (${res.error}). Tente recarregar a página.`);
          // Surface a *visible* error state to the QuestionPlayer instead of
          // silently marking the answer wrong.
          throw new Error(res.error);
        }
        return res;
      } catch (err) {
        // Re-throw so QuestionPlayer can stop the submit spinner.
        throw err;
      }
    },
    [],
  );

  async function handleNext(correct: boolean) {
    const newCorrect = correctCount + (correct ? 1 : 0);
    setCorrectCount(newCorrect);

    if (hearts === 0) {
      // Out of hearts: end run as failure (no completion bonus).
      router.push("/learn?out=hearts");
      return;
    }

    if (index + 1 >= questions.length) {
      const res = await completeLesson({
        lessonId,
        correctCount: newCorrect,
        totalCount: questions.length,
      });
      if (res.ok) {
        setCompletion({
          xpAwarded: res.xpAwarded,
          perfect: res.perfect,
          newStreak: res.newStreak,
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
      />
    );
  }

  if (error) {
    return (
      <main className="container flex min-h-[70vh] flex-col items-center justify-center gap-5 py-12 text-center">
        <Mascot state="sad" size={120} />
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
    <QuestionPlayer
      question={current}
      total={questions.length}
      index={index}
      onSubmit={handleSubmit}
      onNext={handleNext}
      onHearts={setHearts}
    />
  );
}
