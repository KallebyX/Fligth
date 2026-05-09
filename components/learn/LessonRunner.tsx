"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionPlayer, type ChoiceLetter, type PlayerQuestion } from "@/components/learn/QuestionPlayer";
import { LessonCompleteScreen } from "@/components/learn/LessonCompleteScreen";
import { submitAnswer } from "@/app/actions/submitAnswer";
import { completeLesson } from "@/app/actions/completeLesson";

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
  const [completion, setCompletion] = useState<{
    xpAwarded: number;
    perfect: boolean;
    newStreak: number;
  } | null>(null);

  const current = questions[index];

  const handleSubmit = useMemo(
    () => async (questionId: number, choice: ChoiceLetter) => {
      const res = await submitAnswer({ questionId, choice, context: "lesson", wasFirstTry: true });
      if (!res.ok) {
        return {
          correct: false,
          correctChoice: "A" as ChoiceLetter,
          explanation: "Erro: " + res.error,
          hearts: hearts,
        };
      }
      return res;
    },
    [hearts],
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
