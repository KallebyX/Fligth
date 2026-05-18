import { describe, expect, it } from "vitest";
import {
  isEmail,
  isPhoneBR,
  isUsername,
  isUF,
  isReservedUsername,
  EMAIL_RE,
  UFS,
} from "@/lib/validators";

describe("isEmail", () => {
  it("accepts plausible addresses", () => {
    expect(isEmail("foo@bar.com")).toBe(true);
    expect(isEmail("eduardo+test@gmail.com")).toBe(true);
    expect(isEmail("a.b.c@d.e.f")).toBe(true);
  });

  it("rejects the audit case `a@b`", () => {
    // The EmailChangeDialog regression that motivated lib/validators.ts.
    expect(isEmail("a@b")).toBe(false);
  });

  it("rejects whitespace, missing @, missing TLD", () => {
    expect(isEmail("foo bar@baz.com")).toBe(false);
    expect(isEmail("no-at-sign.com")).toBe(false);
    expect(isEmail("user@nodot")).toBe(false);
    expect(isEmail("")).toBe(false);
    expect(isEmail("   ")).toBe(false);
  });

  it("EMAIL_RE is exported for inline use", () => {
    expect(EMAIL_RE.test("ok@ok.com")).toBe(true);
  });
});

describe("isPhoneBR", () => {
  it("accepts BR formats with/without punctuation", () => {
    expect(isPhoneBR("11999999999")).toBe(true);
    expect(isPhoneBR("(11) 99999-9999")).toBe(true);
    expect(isPhoneBR("+55 11 99999-9999")).toBe(true);
    expect(isPhoneBR("1199999999")).toBe(true);
  });

  it("rejects too-short or non-numeric", () => {
    expect(isPhoneBR("1234567")).toBe(false);
    expect(isPhoneBR("abc")).toBe(false);
    expect(isPhoneBR("")).toBe(false);
  });
});

describe("isUsername", () => {
  it("accepts lowercase alphanumeric + underscore, 3–20 chars", () => {
    expect(isUsername("piloto")).toBe(true);
    expect(isUsername("a_b_c_2026")).toBe(true);
    expect(isUsername("abc")).toBe(true);
    expect(isUsername("a".repeat(20))).toBe(true);
  });

  it("rejects uppercase, special chars, wrong length", () => {
    expect(isUsername("Piloto")).toBe(false);
    expect(isUsername("ab")).toBe(false); // too short
    expect(isUsername("a".repeat(21))).toBe(false); // too long
    expect(isUsername("piloto!")).toBe(false);
    expect(isUsername("piloto-1")).toBe(false); // hyphen disallowed
  });
});

describe("isUF", () => {
  it("accepts all 27 Brazilian UFs", () => {
    for (const uf of UFS) {
      expect(isUF(uf)).toBe(true);
    }
    expect(UFS.length).toBe(27);
  });

  it("rejects non-UF strings", () => {
    expect(isUF("ZZ")).toBe(false);
    expect(isUF("sp")).toBe(false); // case-sensitive
    expect(isUF("")).toBe(false);
  });
});

describe("isReservedUsername", () => {
  it("blocks administrative + abusive terms", () => {
    expect(isReservedUsername("admin")).toBe(true);
    expect(isReservedUsername("Admin")).toBe(true); // case-insensitive
    expect(isReservedUsername("anac")).toBe(true);
    expect(isReservedUsername("capitao_lori")).toBe(true);
    expect(isReservedUsername("null")).toBe(true);
  });

  it("allows ordinary names", () => {
    expect(isReservedUsername("eduardo")).toBe(false);
    expect(isReservedUsername("piloto2026")).toBe(false);
  });
});
