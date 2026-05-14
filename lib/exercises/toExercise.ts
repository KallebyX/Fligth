import type { Exercise } from "@/components/learn/exercises/types";
import type {
  FillBlankPayload,
  MatchPairsPayload,
  TapTilesPayload,
  TheoryStepPayload,
  TrueFalsePayload,
} from "@/lib/exercises/types";

export type QuestionRow = {
  id: number;
  stem: string;
  kind: string | null;
  payload: unknown;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
};

// SELECT fragment to use with supabase queries. Keep the same columns the
// lesson + review pages pull so callers can rely on QuestionRow shape.
export const EXERCISE_SELECT =
  "id, stem, kind, payload, choice_a, choice_b, choice_c, choice_d";

export function toExercise(row: QuestionRow): Exercise | null {
  const kind = (row.kind ?? "multiple_choice") as Exercise["kind"];
  switch (kind) {
    case "multiple_choice":
      return {
        id: row.id,
        kind,
        stem: row.stem,
        choices: {
          A: row.choice_a,
          B: row.choice_b,
          C: row.choice_c,
          D: row.choice_d,
        },
      };
    case "match_pairs":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as MatchPairsPayload }
        : null;
    case "fill_blank":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as FillBlankPayload }
        : null;
    case "true_false":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as TrueFalsePayload }
        : null;
    case "tap_tiles":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as TapTilesPayload }
        : null;
    case "theory_step":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as TheoryStepPayload }
        : null;
    default:
      return null;
  }
}
