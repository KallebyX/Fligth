// Client-side exercise types. Exercise is the polymorphic shape pulled
// from `questions_public`; ExerciseSubmission is the union of all things
// a player might submit. submitAnswer cherry-picks the right field.

import type {
  FillBlankPayload,
  MatchPairsPayload,
  TapTilesPayload,
  TheoryStepPayload,
  TrueFalsePayload,
} from "@/lib/exercises/types";

export type ChoiceLetter = "A" | "B" | "C" | "D";

export type Exercise =
  | {
      id: number;
      kind: "multiple_choice";
      stem: string;
      choices: { A: string; B: string; C: string; D: string };
    }
  | { id: number; kind: "match_pairs"; stem: string; payload: MatchPairsPayload }
  | { id: number; kind: "fill_blank"; stem: string; payload: FillBlankPayload }
  | { id: number; kind: "true_false"; stem: string; payload: TrueFalsePayload }
  | { id: number; kind: "tap_tiles"; stem: string; payload: TapTilesPayload }
  | { id: number; kind: "theory_step"; stem: string; payload: TheoryStepPayload };

export type ExerciseSubmission = {
  choice?: ChoiceLetter;
  matches?: { left: number; right: number }[];
  fillIndex?: number;
  bool?: boolean;
  order?: number[];
};

export type ExerciseSubmitResult = {
  correct: boolean;
  correctChoice: ChoiceLetter;
  explanation: string | null;
  hearts: number;
};

export type ExerciseSubmitFn = (
  questionId: number,
  submission: ExerciseSubmission,
) => Promise<ExerciseSubmitResult>;

export type PlayerProps<E extends Exercise = Exercise> = {
  exercise: E;
  total: number;
  index: number;
  onSubmit: ExerciseSubmitFn;
  onNext: (correct: boolean, isTheory?: boolean) => void;
  onHearts?: (h: number) => void;
  mascotOutfit?: string | null;
  hearts?: number;
  gems?: number;
  onAbandon?: () => void;
  isPractice?: boolean;
};
