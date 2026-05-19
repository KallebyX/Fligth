import { describe, expect, it } from "vitest";
import { validateExercise } from "@/lib/exercises/validate";

describe("validateExercise — multiple_choice", () => {
  it("correct: response.choice matches correctChoice", () => {
    const r = validateExercise({
      kind: "multiple_choice",
      correctChoice: "B",
      payload: null,
      response: { choice: "B" },
    });
    expect(r.correct).toBe(true);
    expect(r.correctChoice).toBe("B");
  });

  it("incorrect: mismatch returns false but still surfaces the correct letter", () => {
    const r = validateExercise({
      kind: "multiple_choice",
      correctChoice: "C",
      payload: null,
      response: { choice: "A" },
    });
    expect(r.correct).toBe(false);
    expect(r.correctChoice).toBe("C");
  });

  it("no choice submitted = wrong", () => {
    const r = validateExercise({
      kind: "multiple_choice",
      correctChoice: "A",
      payload: null,
      response: {},
    });
    expect(r.correct).toBe(false);
  });
});

describe("validateExercise — true_false", () => {
  it("correct boolean returns true", () => {
    const r = validateExercise({
      kind: "true_false",
      correctChoice: null,
      payload: { correct: true },
      response: { bool: true },
    });
    expect(r.correct).toBe(true);
  });

  it("wrong boolean returns false", () => {
    const r = validateExercise({
      kind: "true_false",
      correctChoice: null,
      payload: { correct: true },
      response: { bool: false },
    });
    expect(r.correct).toBe(false);
  });

  it("missing payload defends to false", () => {
    const r = validateExercise({
      kind: "true_false",
      correctChoice: null,
      payload: null,
      response: { bool: true },
    });
    expect(r.correct).toBe(false);
  });
});

describe("validateExercise — fill_blank", () => {
  it("correct index matches payload.answer", () => {
    const r = validateExercise({
      kind: "fill_blank",
      correctChoice: null,
      payload: { template: "{0}", bank: ["a", "b", "c"], answer: 2 },
      response: { fillIndex: 2 },
    });
    expect(r.correct).toBe(true);
  });

  it("wrong index = false", () => {
    const r = validateExercise({
      kind: "fill_blank",
      correctChoice: null,
      payload: { template: "{0}", bank: ["a", "b"], answer: 0 },
      response: { fillIndex: 1 },
    });
    expect(r.correct).toBe(false);
  });
});

describe("validateExercise — match_pairs", () => {
  it("all pairs match their left index → correct", () => {
    const r = validateExercise({
      kind: "match_pairs",
      correctChoice: null,
      payload: {
        pairs: [
          { left: "VFR", right: "Visual" },
          { left: "IFR", right: "Instruments" },
        ],
      },
      response: {
        matches: [
          { left: 0, right: 0 },
          { left: 1, right: 1 },
        ],
      },
    });
    expect(r.correct).toBe(true);
  });

  it("mismatched pair = incorrect", () => {
    const r = validateExercise({
      kind: "match_pairs",
      correctChoice: null,
      payload: {
        pairs: [
          { left: "VFR", right: "Visual" },
          { left: "IFR", right: "Instruments" },
        ],
      },
      response: {
        matches: [
          { left: 0, right: 1 },
          { left: 1, right: 0 },
        ],
      },
    });
    expect(r.correct).toBe(false);
  });

  it("wrong number of pairs = incorrect", () => {
    const r = validateExercise({
      kind: "match_pairs",
      correctChoice: null,
      payload: { pairs: [{ left: "A", right: "B" }] },
      response: { matches: [] },
    });
    expect(r.correct).toBe(false);
  });
});

describe("validateExercise — tap_tiles", () => {
  it("correct order matches", () => {
    const r = validateExercise({
      kind: "tap_tiles",
      correctChoice: null,
      payload: { words: ["a", "b", "c"], correct: [1, 0, 2] },
      response: { order: [1, 0, 2] },
    });
    expect(r.correct).toBe(true);
  });

  it("scrambled order = wrong", () => {
    const r = validateExercise({
      kind: "tap_tiles",
      correctChoice: null,
      payload: { words: ["a", "b", "c"], correct: [0, 1, 2] },
      response: { order: [2, 1, 0] },
    });
    expect(r.correct).toBe(false);
  });

  it("short response (didn't fill all tiles) = wrong", () => {
    const r = validateExercise({
      kind: "tap_tiles",
      correctChoice: null,
      payload: { words: ["a", "b", "c"], correct: [0, 1, 2] },
      response: { order: [0, 1] },
    });
    expect(r.correct).toBe(false);
  });
});

describe("validateExercise — theory_step", () => {
  it("always returns correct (forgiving)", () => {
    const r = validateExercise({
      kind: "theory_step",
      correctChoice: null,
      payload: { md: "Read this." },
      response: {},
    });
    expect(r.correct).toBe(true);
  });

  it("inline verify is recorded but never penalises", () => {
    const r = validateExercise({
      kind: "theory_step",
      correctChoice: null,
      payload: { md: "...", verify: { stem: "ok?", correct: true } },
      response: { bool: false }, // wrong answer
    });
    // Still counts as correct — theory_step is engagement, not assessment.
    expect(r.correct).toBe(true);
  });
});
