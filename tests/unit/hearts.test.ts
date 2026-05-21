import { describe, expect, it } from "vitest";
import {
  computeHearts,
  loseHeart,
  MAX_HEARTS,
  REGEN_INTERVAL_MS,
  type HeartState,
} from "@/lib/hearts";

const T0 = new Date("2026-01-01T12:00:00Z");
const min = (n: number) => new Date(T0.getTime() + n * 60_000);

describe("computeHearts", () => {
  it("at MAX clears any regen timestamp", () => {
    const state: HeartState = {
      hearts: 5,
      hearts_regen_at: "2026-01-01T11:00:00Z",
    };
    const r = computeHearts(state, T0);
    expect(r.hearts).toBe(5);
    expect(r.hearts_regen_at).toBeNull();
    expect(r.changed).toBe(true);
  });

  it("at MAX with no regen → unchanged", () => {
    const state: HeartState = { hearts: 5, hearts_regen_at: null };
    const r = computeHearts(state, T0);
    expect(r.changed).toBe(false);
  });

  it("below MAX with no regen schedule → starts a 30min timer", () => {
    const state: HeartState = { hearts: 3, hearts_regen_at: null };
    const r = computeHearts(state, T0);
    expect(r.hearts).toBe(3);
    expect(r.hearts_regen_at).toBe(min(30).toISOString());
    expect(r.changed).toBe(true);
  });

  it("before regen due → no change", () => {
    const state: HeartState = {
      hearts: 3,
      hearts_regen_at: min(30).toISOString(),
    };
    const r = computeHearts(state, min(15));
    expect(r.changed).toBe(false);
  });

  it("after one regen interval → +1 heart, timer rolls forward", () => {
    const state: HeartState = {
      hearts: 3,
      hearts_regen_at: min(30).toISOString(),
    };
    const r = computeHearts(state, min(30));
    expect(r.hearts).toBe(4);
    expect(r.hearts_regen_at).toBe(min(60).toISOString());
  });

  it("after two intervals while missing 2 hearts → +2 hearts", () => {
    const state: HeartState = {
      hearts: 3,
      hearts_regen_at: min(30).toISOString(),
    };
    const r = computeHearts(state, min(90));
    // Started at 30, +1 at 30 (→ 4), +1 at 60 (→ 5). Now full.
    expect(r.hearts).toBe(5);
    expect(r.hearts_regen_at).toBeNull();
  });

  it("regen doesn't exceed MAX_HEARTS even after long absence", () => {
    const state: HeartState = {
      hearts: 1,
      hearts_regen_at: min(30).toISOString(),
    };
    const r = computeHearts(state, min(60 * 24)); // 24 hours later
    expect(r.hearts).toBe(5);
    expect(r.hearts_regen_at).toBeNull();
  });
});

describe("loseHeart", () => {
  it("decrements by 1, never below 0", () => {
    expect(loseHeart({ hearts: 3, hearts_regen_at: null }, T0).hearts).toBe(2);
    expect(loseHeart({ hearts: 0, hearts_regen_at: null }, T0).hearts).toBe(0);
  });

  it("losing from MAX schedules first regen 30min out", () => {
    const r = loseHeart({ hearts: 5, hearts_regen_at: null }, T0);
    expect(r.hearts).toBe(4);
    expect(r.hearts_regen_at).toBe(min(30).toISOString());
  });

  it("losing again before regen completes keeps existing timer", () => {
    const state: HeartState = {
      hearts: 4,
      hearts_regen_at: min(30).toISOString(),
    };
    const r = loseHeart(state, min(10));
    expect(r.hearts).toBe(3);
    expect(r.hearts_regen_at).toBe(min(30).toISOString()); // unchanged
  });
});

describe("constants", () => {
  it("MAX_HEARTS = 5", () => {
    expect(MAX_HEARTS).toBe(5);
  });
  it("REGEN_INTERVAL_MS = 30 minutes", () => {
    expect(REGEN_INTERVAL_MS).toBe(30 * 60 * 1000);
  });
});
