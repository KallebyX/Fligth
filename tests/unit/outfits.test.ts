import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pickWeighted } from "@/lib/outfits/catalog";
import { rouletteAvailableAt } from "@/lib/outfits/roulette";
import { jackpotAvailableAt } from "@/lib/outfits/jackpot";
import {
  ROULETTE_COOLDOWN_MS,
  ROULETTE_DUPLICATE_GEMS,
  JACKPOT_COOLDOWN_MS,
  JACKPOT_COST_GEMS,
  JACKPOT_DUPLICATE_GEMS,
} from "@/lib/outfits/constants";

describe("pickWeighted", () => {
  it("returns null on empty pool", () => {
    expect(pickWeighted([])).toBeNull();
  });

  it("returns null when all weights are zero", () => {
    expect(pickWeighted([{ drop_weight: 0 }, { drop_weight: 0 }])).toBeNull();
  });

  it("with a single item always returns it", () => {
    const only = { drop_weight: 10, id: "only" };
    for (let i = 0; i < 5; i++) {
      expect(pickWeighted([only])).toBe(only);
    }
  });

  it("respects weight distribution (statistical)", () => {
    const pool = [
      { id: "a", drop_weight: 1 },
      { id: "b", drop_weight: 9 },
    ];
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 1000; i++) {
      const r = pickWeighted(pool);
      if (r) counts[r.id as "a" | "b"]++;
    }
    // ~90% should be "b". Allow generous tolerance for randomness.
    expect(counts.b).toBeGreaterThan(800);
    expect(counts.a).toBeGreaterThan(50);
  });
});

describe("rouletteAvailableAt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("null last spin → ready immediately, no nextAt", () => {
    const r = rouletteAvailableAt(null);
    expect(r.ready).toBe(true);
    expect(r.nextAt).toBeNull();
  });

  it("spin 25h ago → ready (past cooldown), no nextAt", () => {
    const past = new Date(Date.now() - 25 * 3600_000).toISOString();
    const r = rouletteAvailableAt(past);
    expect(r.ready).toBe(true);
    expect(r.nextAt).toBeNull();
  });

  it("spin 1h ago → still on cooldown, nextAt = lastSpinAt+24h", () => {
    const past = new Date(Date.now() - 1 * 3600_000).toISOString();
    const r = rouletteAvailableAt(past);
    expect(r.ready).toBe(false);
    expect(r.nextAt).toBe(
      new Date(new Date(past).getTime() + ROULETTE_COOLDOWN_MS).toISOString(),
    );
  });
});

describe("jackpotAvailableAt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("null last spin → ready, no nextAt", () => {
    const r = jackpotAvailableAt(null);
    expect(r.ready).toBe(true);
    expect(r.nextAt).toBeNull();
  });

  it("spin 2h ago → ready (past 1h cooldown)", () => {
    const past = new Date(Date.now() - 2 * 3600_000).toISOString();
    expect(jackpotAvailableAt(past).ready).toBe(true);
  });

  it("spin 30min ago → still on cooldown", () => {
    const past = new Date(Date.now() - 30 * 60_000).toISOString();
    expect(jackpotAvailableAt(past).ready).toBe(false);
  });
});

describe("constants", () => {
  it("ROULETTE_COOLDOWN_MS = 24h", () => {
    expect(ROULETTE_COOLDOWN_MS).toBe(24 * 60 * 60 * 1000);
  });
  it("ROULETTE_DUPLICATE_GEMS = 20", () => {
    expect(ROULETTE_DUPLICATE_GEMS).toBe(20);
  });
  it("JACKPOT_COOLDOWN_MS = 1h", () => {
    expect(JACKPOT_COOLDOWN_MS).toBe(60 * 60 * 1000);
  });
  it("JACKPOT_COST_GEMS = 50 (matches HUD copy + RoulettePanel)", () => {
    expect(JACKPOT_COST_GEMS).toBe(50);
  });
  it("JACKPOT_DUPLICATE_GEMS = 25 (half the cost — partial refund on dupe)", () => {
    expect(JACKPOT_DUPLICATE_GEMS).toBe(25);
    expect(JACKPOT_DUPLICATE_GEMS).toBe(JACKPOT_COST_GEMS / 2);
  });
});
