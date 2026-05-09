import { describe, it, expect } from "vitest";
import { bumpStreak } from "./streak";

const base = {
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: null,
  streak_freezes: 0,
};

describe("bumpStreak", () => {
  it("first activity ever sets streak to 1", () => {
    const r = bumpStreak(base, "2026-01-10");
    expect(r.current_streak).toBe(1);
    expect(r.last_activity_date).toBe("2026-01-10");
    expect(r.changed).toBe(true);
  });

  it("same-day activity is a no-op", () => {
    const r = bumpStreak({ ...base, current_streak: 3, last_activity_date: "2026-01-10" }, "2026-01-10");
    expect(r.current_streak).toBe(3);
    expect(r.changed).toBe(false);
  });

  it("consecutive day increments streak", () => {
    const r = bumpStreak({ ...base, current_streak: 3, last_activity_date: "2026-01-10" }, "2026-01-11");
    expect(r.current_streak).toBe(4);
    expect(r.longest_streak).toBe(4);
  });

  it("missed day without freezes resets streak to 1", () => {
    const r = bumpStreak({ ...base, current_streak: 7, last_activity_date: "2026-01-10" }, "2026-01-13");
    expect(r.current_streak).toBe(1);
  });

  it("missed day with a freeze consumes it and continues", () => {
    const r = bumpStreak(
      { ...base, current_streak: 7, last_activity_date: "2026-01-10", streak_freezes: 1 },
      "2026-01-12",
    );
    expect(r.current_streak).toBe(8);
    expect(r.streak_freezes).toBe(0);
  });

  it("longest_streak is preserved across resets", () => {
    const r = bumpStreak(
      { ...base, current_streak: 3, longest_streak: 30, last_activity_date: "2026-01-01" },
      "2026-01-20",
    );
    expect(r.current_streak).toBe(1);
    expect(r.longest_streak).toBe(30);
  });
});
