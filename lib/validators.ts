/**
 * Centralized validators for user input.
 *
 * Before this module existed, the same email regex lived in 3 places, phone
 * regex in 2, UFS list in another file, and the EmailChangeDialog used a
 * naive `includes("@")` check that accepted `a@b`. This module is the single
 * source of truth — any new form should import from here.
 *
 * Keep regexes loose-but-defensive: they catch the 99% of obvious bad input
 * (whitespace, missing @, missing TLD, too short) without rejecting valid
 * unusual addresses (RFC 5322 is harder than it looks). Server-side, Supabase
 * Auth / RLS handles the rest.
 */

/** Loose email regex — local@domain.tld with no whitespace. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Brazilian phone — accepts digits + common punctuation, 8–30 chars. */
export const PHONE_RE_BR = /^[\d\s()+\-]{8,30}$/;

/** App-internal usernames: lowercase letters, digits, underscore, 3–20 chars. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/** Brazilian state codes (UFs). 27 entries — never grows. */
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type UF = (typeof UFS)[number];

/** Type guard for UF strings (handy in admin forms). */
export function isUF(s: string): s is UF {
  return (UFS as readonly string[]).includes(s);
}

/** Check that a string is a plausible email. */
export function isEmail(s: string): boolean {
  return EMAIL_RE.test(s);
}

/** Check that a string is a plausible BR phone. */
export function isPhoneBR(s: string): boolean {
  return PHONE_RE_BR.test(s);
}

/** Check that a string is a valid app username. */
export function isUsername(s: string): boolean {
  return USERNAME_RE.test(s);
}

/** Common reserved usernames blocked from claim (administrative, abusive). */
export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "root", "system", "support", "help",
  "anac", "ipa", "moderator", "mod", "official", "staff",
  "lori", "capitao_lori", "capitao", "captain", "captao",
  "null", "undefined", "test", "deleted",
]);

/** True if the username is blocked from claim (case-insensitive). */
export function isReservedUsername(s: string): boolean {
  return RESERVED_USERNAMES.has(s.toLowerCase());
}
