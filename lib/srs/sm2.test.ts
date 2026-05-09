import { describe, it, expect } from "vitest";
import { nextReview, nextReviewBoolean } from "./sm2";

describe("SM-2", () => {
  it("first correct answer schedules 1 day later", () => {
    const r = nextReview({ easiness: 2.5, interval: 0, repetitions: 0 }, 5);
    expect(r.repetitions).toBe(1);
    expect(r.interval).toBe(1);
  });

  it("second correct answer schedules 6 days later", () => {
    const r = nextReview({ easiness: 2.5, interval: 1, repetitions: 1 }, 5);
    expect(r.repetitions).toBe(2);
    expect(r.interval).toBe(6);
  });

  it("third correct answer multiplies by easiness", () => {
    const r = nextReview({ easiness: 2.5, interval: 6, repetitions: 2 }, 5);
    expect(r.repetitions).toBe(3);
    expect(r.interval).toBe(15); // 6 * 2.5
  });

  it("wrong answer (q<3) resets repetitions and schedules 1 day later", () => {
    const r = nextReview({ easiness: 2.5, interval: 6, repetitions: 2 }, 1);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
  });

  it("easiness never drops below 1.3", () => {
    let s = { easiness: 2.5, interval: 0, repetitions: 0 };
    for (let i = 0; i < 20; i++) s = nextReview(s, 0);
    expect(s.easiness).toBeGreaterThanOrEqual(1.3);
  });

  it("nextReviewBoolean: correct + first try = quality 5", () => {
    const r = nextReviewBoolean({ easiness: 2.5, interval: 0, repetitions: 0 }, true, true);
    expect(r.repetitions).toBe(1);
  });

  it("nextReviewBoolean: wrong = quality 1, resets", () => {
    const r = nextReviewBoolean({ easiness: 2.5, interval: 6, repetitions: 2 }, false);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
  });
});
