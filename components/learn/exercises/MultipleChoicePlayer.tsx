"use client";

import { QuestionPlayer, type PlayerQuestion } from "@/components/learn/QuestionPlayer";
import type { Exercise, PlayerProps } from "./types";

// Adapter: turns the legacy QuestionPlayer (which only knows about MCQ)
// into something that fits the unified ExercisePlayer router contract.
// We don't refactor QuestionPlayer itself because ReviewRunner still uses
// its narrower API.
export function MultipleChoicePlayer({
  exercise,
  total,
  index,
  onSubmit,
  onNext,
  onHearts,
}: PlayerProps<Extract<Exercise, { kind: "multiple_choice" }>>) {
  const question: PlayerQuestion = {
    id: exercise.id,
    stem: exercise.stem,
    choices: exercise.choices,
  };

  return (
    <QuestionPlayer
      question={question}
      total={total}
      index={index}
      onSubmit={(qid, choice) => onSubmit(qid, { choice })}
      onNext={onNext}
      onHearts={onHearts}
    />
  );
}
