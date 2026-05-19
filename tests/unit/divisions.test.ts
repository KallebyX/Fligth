import { describe, expect, it } from "vitest";
import {
  DIVISIONS,
  DIVISION_BY_SLUG,
  getDivision,
  nextDivision,
  prevDivision,
  PROMOTE_TOP,
  RELEGATE_BOTTOM,
} from "@/lib/leagues/divisions";

describe("DIVISIONS catalog", () => {
  it("has exactly 10 tiers in ascending order", () => {
    expect(DIVISIONS).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(DIVISIONS[i].tier).toBe(i + 1);
    }
  });

  it("first tier is bronze, last is diamante", () => {
    expect(DIVISIONS[0].slug).toBe("bronze");
    expect(DIVISIONS[DIVISIONS.length - 1].slug).toBe("diamante");
  });

  it("every slug appears exactly once", () => {
    const slugs = DIVISIONS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("DIVISION_BY_SLUG matches the array", () => {
    for (const d of DIVISIONS) {
      expect(DIVISION_BY_SLUG.get(d.slug)?.tier).toBe(d.tier);
    }
  });
});

describe("getDivision", () => {
  it("returns the matching tier", () => {
    expect(getDivision("rubi").tier).toBe(5);
    expect(getDivision("diamante").tier).toBe(10);
  });

  it("defaults to bronze for null/undefined/unknown", () => {
    expect(getDivision(null).slug).toBe("bronze");
    expect(getDivision(undefined).slug).toBe("bronze");
    expect(getDivision("zzz_invalid").slug).toBe("bronze");
  });
});

describe("nextDivision / prevDivision", () => {
  it("nextDivision walks up the chain", () => {
    expect(nextDivision("bronze")).toBe("prata");
    expect(nextDivision("prata")).toBe("ouro");
    expect(nextDivision("rubi")).toBe("esmeralda");
  });

  it("nextDivision saturates at diamante (top)", () => {
    expect(nextDivision("diamante")).toBe("diamante");
  });

  it("prevDivision walks down the chain", () => {
    expect(prevDivision("diamante")).toBe("obsidiana");
    expect(prevDivision("ouro")).toBe("prata");
  });

  it("prevDivision saturates at bronze (floor)", () => {
    expect(prevDivision("bronze")).toBe("bronze");
  });
});

describe("league promotion constants", () => {
  it("PROMOTE_TOP = 10 (Duolingo-style top-10 promote)", () => {
    expect(PROMOTE_TOP).toBe(10);
  });

  it("RELEGATE_BOTTOM = 5", () => {
    expect(RELEGATE_BOTTOM).toBe(5);
  });

  it("PROMOTE_TOP + RELEGATE_BOTTOM ≤ 30 (one division's leaderboard cap)", () => {
    // The cron seeds 30 members per division. Promoting 10 + relegating 5
    // leaves 15 stayers — sane mid-band.
    expect(PROMOTE_TOP + RELEGATE_BOTTOM).toBeLessThanOrEqual(30);
  });
});
