"use client";

import { MultipleChoicePlayer } from "@/components/learn/exercises/MultipleChoicePlayer";
import { MatchPairsPlayer } from "@/components/learn/exercises/MatchPairsPlayer";
import { FillBlankPlayer } from "@/components/learn/exercises/FillBlankPlayer";
import { TrueFalsePlayer } from "@/components/learn/exercises/TrueFalsePlayer";
import { TapTilesPlayer } from "@/components/learn/exercises/TapTilesPlayer";
import { TheoryStepPlayer } from "@/components/learn/exercises/TheoryStepPlayer";
import type { Exercise, PlayerProps } from "@/components/learn/exercises/types";

export type { Exercise, PlayerProps } from "@/components/learn/exercises/types";

export function ExercisePlayer(props: PlayerProps) {
  const { exercise } = props;
  switch (exercise.kind) {
    case "multiple_choice":
      return <MultipleChoicePlayer {...(props as PlayerProps<Extract<Exercise, { kind: "multiple_choice" }>>)} />;
    case "match_pairs":
      return <MatchPairsPlayer {...(props as PlayerProps<Extract<Exercise, { kind: "match_pairs" }>>)} />;
    case "fill_blank":
      return <FillBlankPlayer {...(props as PlayerProps<Extract<Exercise, { kind: "fill_blank" }>>)} />;
    case "true_false":
      return <TrueFalsePlayer {...(props as PlayerProps<Extract<Exercise, { kind: "true_false" }>>)} />;
    case "tap_tiles":
      return <TapTilesPlayer {...(props as PlayerProps<Extract<Exercise, { kind: "tap_tiles" }>>)} />;
    case "theory_step":
      return <TheoryStepPlayer {...(props as PlayerProps<Extract<Exercise, { kind: "theory_step" }>>)} />;
  }
}
