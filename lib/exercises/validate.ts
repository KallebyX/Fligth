// Server-side validators. The client never sees the "correct" payload for
// auto-graded kinds — we look the row up via the service-role client and
// compare here. Returning a uniform { correct, correctChoice? } lets the
// QuestionPlayer flow stay shape-stable across all kinds.

import type {
  ExerciseKind,
  FillBlankPayload,
  MatchPairsPayload,
  TapTilesPayload,
  TheoryStepPayload,
  TrueFalsePayload,
} from "./types";

export type ValidationInput = {
  kind: ExerciseKind;
  // For multiple_choice the row also has a `correct` column outside payload.
  correctChoice: "A" | "B" | "C" | "D" | null;
  payload: unknown;
  // What the user submitted.
  response: {
    choice?: "A" | "B" | "C" | "D";
    matches?: { left: number; right: number }[];
    fillIndex?: number;
    bool?: boolean;
    order?: number[];
  };
};

export type ValidationResult = {
  correct: boolean;
  // For UI display: the canonical answer in a form the player can render.
  // Multiple-choice returns the letter; the others return null because the
  // player already knows the spec from the payload.
  correctChoice: "A" | "B" | "C" | "D" | null;
};

export function validateExercise(input: ValidationInput): ValidationResult {
  switch (input.kind) {
    case "multiple_choice":
      return {
        correct: input.response.choice === input.correctChoice,
        correctChoice: input.correctChoice,
      };

    case "true_false": {
      const p = input.payload as TrueFalsePayload | null;
      const ok =
        p != null &&
        typeof input.response.bool === "boolean" &&
        input.response.bool === p.correct;
      return { correct: ok, correctChoice: null };
    }

    case "fill_blank": {
      const p = input.payload as FillBlankPayload | null;
      const ok =
        p != null &&
        typeof input.response.fillIndex === "number" &&
        input.response.fillIndex === p.answer;
      return { correct: ok, correctChoice: null };
    }

    case "match_pairs": {
      const p = input.payload as MatchPairsPayload | null;
      const userPairs = input.response.matches ?? [];
      if (!p || userPairs.length !== p.pairs.length) {
        return { correct: false, correctChoice: null };
      }
      // Each connection `{left, right}` is correct when the left index equals
      // the right index (i.e. user paired pairs[i].left with pairs[i].right).
      const allMatch = userPairs.every((m) => m.left === m.right);
      return { correct: allMatch, correctChoice: null };
    }

    case "tap_tiles": {
      const p = input.payload as TapTilesPayload | null;
      const order = input.response.order ?? [];
      if (!p || order.length !== p.correct.length) {
        return { correct: false, correctChoice: null };
      }
      const equal = order.every((v, i) => v === p.correct[i]);
      return { correct: equal, correctChoice: null };
    }

    case "theory_step": {
      // Theory steps are always "correct" — the user just reads + confirms.
      // If an inline verify is present, treat it as a sub-true-false but
      // never penalise (still mark as correct so XP flows).
      const p = input.payload as TheoryStepPayload | null;
      if (p?.verify && typeof input.response.bool === "boolean") {
        // Record but don't fail; theory is forgiving.
        void (input.response.bool === p.verify.correct);
      }
      return { correct: true, correctChoice: null };
    }

    default:
      return { correct: false, correctChoice: null };
  }
}
