import { describe, expect, it } from "vitest";
import {
  XP_PER_CORRECT_LESSON,
  XP_PER_CORRECT_REVIEW,
  XP_PER_THEORY,
  XP_LESSON_COMPLETE_BONUS,
} from "@/lib/xp";

describe("XP constants", () => {
  it("XP_PER_CORRECT_LESSON = 10", () => {
    expect(XP_PER_CORRECT_LESSON).toBe(10);
  });

  it("XP_PER_CORRECT_REVIEW = 5 (half — review is reinforcement)", () => {
    expect(XP_PER_CORRECT_REVIEW).toBe(5);
    expect(XP_PER_CORRECT_REVIEW).toBe(XP_PER_CORRECT_LESSON / 2);
  });

  it("XP_PER_THEORY = 5 (theory rewards engagement, not mastery)", () => {
    expect(XP_PER_THEORY).toBe(5);
  });

  it("XP_LESSON_COMPLETE_BONUS = 10 (perfect-run reward)", () => {
    expect(XP_LESSON_COMPLETE_BONUS).toBe(10);
  });

  it("perfect MCQ-only lesson math: 5 questions = 5*10 + 10 bonus = 60 XP", () => {
    const correct = 5;
    const theory = 0;
    const perfect = true;
    const xp =
      correct * XP_PER_CORRECT_LESSON +
      theory * XP_PER_THEORY +
      (perfect ? XP_LESSON_COMPLETE_BONUS : 0);
    expect(xp).toBe(60);
  });

  it("imperfect mixed-kind lesson: 3 correct + 2 theory + 1 wrong = 40 XP", () => {
    const correct = 3;
    const theory = 2;
    const perfect = false;
    const xp =
      correct * XP_PER_CORRECT_LESSON +
      theory * XP_PER_THEORY +
      (perfect ? XP_LESSON_COMPLETE_BONUS : 0);
    expect(xp).toBe(40);
  });
});
