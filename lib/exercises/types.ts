// Shared exercise-payload typings. These describe the JSON stored in
// public.questions.payload for each `kind`. The shapes mirror what the
// players in components/learn/exercises/* expect.

export type ExerciseKind =
  | "multiple_choice"
  | "match_pairs"
  | "fill_blank"
  | "true_false"
  | "tap_tiles"
  | "theory_step";

export type MatchPairsPayload = {
  pairs: { left: string; right: string }[];
};

export type FillBlankPayload = {
  template: string;
  bank: string[];
  answer: number;
};

export type TrueFalsePayload = {
  statement: string;
  correct: boolean;
};

export type TapTilesPayload = {
  words: string[];
  correct: number[];
};

export type TheoryStepPayload = {
  heading?: string;
  body_md: string;
  verify?: { type: "true_false"; statement: string; correct: boolean };
};

// Multiple-choice payload is optional — when present, lets the question
// surface a media asset above the stem. Used for aircraft-identification
// quizzes and any other visual question kind.
export type MultipleChoicePayload = {
  image_url?: string;
  image_alt?: string;
  /** Caption shown under the image. */
  image_caption?: string;
};

export type ExercisePayload =
  | { kind: "multiple_choice"; payload: MultipleChoicePayload | null }
  | { kind: "match_pairs"; payload: MatchPairsPayload }
  | { kind: "fill_blank"; payload: FillBlankPayload }
  | { kind: "true_false"; payload: TrueFalsePayload }
  | { kind: "tap_tiles"; payload: TapTilesPayload }
  | { kind: "theory_step"; payload: TheoryStepPayload };

export type SubmissionResponse = {
  // Multiple choice (legacy)
  choice?: "A" | "B" | "C" | "D";
  // Match pairs: array of {leftIdx, rightIdx} the user connected
  matches?: { left: number; right: number }[];
  // Fill blank: which bank index was placed in the slot
  fillIndex?: number;
  // True/false: user pick
  bool?: boolean;
  // Tap tiles: ordered indices the user picked
  order?: number[];
};
