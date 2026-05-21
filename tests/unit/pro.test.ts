import { describe, expect, it } from "vitest";
import { computeProStatus } from "@/lib/pro";

const T0 = new Date("2026-01-01T12:00:00Z");
const FUTURE = "2027-01-01T00:00:00Z";
const PAST = "2025-01-01T00:00:00Z";

describe("computeProStatus", () => {
  it("lifetime plan = isPro regardless of timestamp", () => {
    const r = computeProStatus(null, "lifetime", T0);
    expect(r.isPro).toBe(true);
    expect(r.plan).toBe("lifetime");
    expect(r.expiresAt).toBeNull();
  });

  it("lifetime overrides even an expired pro_until", () => {
    const r = computeProStatus(PAST, "lifetime", T0);
    expect(r.isPro).toBe(true);
    expect(r.plan).toBe("lifetime");
    expect(r.expiresAt).toBeNull();
  });

  it("null pro_until = not Pro", () => {
    const r = computeProStatus(null, null, T0);
    expect(r.isPro).toBe(false);
    expect(r.plan).toBeNull();
    expect(r.expiresAt).toBeNull();
  });

  it("active monthly plan = isPro", () => {
    const r = computeProStatus(FUTURE, "monthly", T0);
    expect(r.isPro).toBe(true);
    expect(r.plan).toBe("monthly");
    expect(r.expiresAt).toBe(new Date(FUTURE).toISOString());
  });

  it("expired pro_until = not Pro but keeps expiresAt", () => {
    const r = computeProStatus(PAST, "monthly", T0);
    expect(r.isPro).toBe(false);
    expect(r.plan).toBeNull();
    expect(r.expiresAt).toBe(new Date(PAST).toISOString());
  });

  it("active without a plan name → defaults plan to 'monthly'", () => {
    const r = computeProStatus(FUTURE, null, T0);
    expect(r.isPro).toBe(true);
    expect(r.plan).toBe("monthly");
  });

  it("active trial plan is preserved", () => {
    const r = computeProStatus(FUTURE, "trial", T0);
    expect(r.isPro).toBe(true);
    expect(r.plan).toBe("trial");
  });

  it("boundary: pro_until exactly now → not Pro (strict >)", () => {
    const r = computeProStatus(T0.toISOString(), "monthly", T0);
    expect(r.isPro).toBe(false);
  });
});
