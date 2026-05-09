import { describe, it, expect } from "vitest";
import { computeHearts, loseHeart, MAX_HEARTS, REGEN_INTERVAL_MS } from "./hearts";

describe("computeHearts", () => {
  it("max hearts have no regen timer", () => {
    const r = computeHearts({ hearts: 5, hearts_regen_at: null });
    expect(r.hearts).toBe(MAX_HEARTS);
    expect(r.hearts_regen_at).toBeNull();
  });

  it("missing heart starts a fresh regen timer", () => {
    const now = new Date("2026-01-10T10:00:00Z");
    const r = computeHearts({ hearts: 4, hearts_regen_at: null }, now);
    expect(r.hearts).toBe(4);
    expect(r.hearts_regen_at).toBe(new Date(now.getTime() + REGEN_INTERVAL_MS).toISOString());
    expect(r.changed).toBe(true);
  });

  it("regenerates one heart the moment hearts_regen_at is reached", () => {
    const now = new Date("2026-01-10T10:00:00Z");
    const regenAt = new Date("2026-01-10T10:00:00Z").toISOString();
    const r = computeHearts({ hearts: 3, hearts_regen_at: regenAt }, now);
    expect(r.hearts).toBe(4);
  });

  it("regenerates two hearts when one extra interval has fully passed", () => {
    const now = new Date("2026-01-10T10:30:00Z");
    const regenAt = new Date("2026-01-10T10:00:00Z").toISOString();
    const r = computeHearts({ hearts: 3, hearts_regen_at: regenAt }, now);
    expect(r.hearts).toBe(5);
  });

  it("regenerates several hearts if a long time passed", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const regenAt = new Date("2026-01-10T10:00:00Z").toISOString();
    const r = computeHearts({ hearts: 0, hearts_regen_at: regenAt }, now);
    expect(r.hearts).toBe(5);
    expect(r.hearts_regen_at).toBeNull();
  });
});

describe("loseHeart", () => {
  it("decreases by one and schedules regen", () => {
    const r = loseHeart({ hearts: 5, hearts_regen_at: null });
    expect(r.hearts).toBe(4);
    expect(r.hearts_regen_at).not.toBeNull();
  });

  it("does not go below zero", () => {
    const r = loseHeart({ hearts: 0, hearts_regen_at: null });
    expect(r.hearts).toBe(0);
  });
});
