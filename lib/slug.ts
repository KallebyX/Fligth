/**
 * URL-safe slug generator.
 *
 * Steps: lowercase → NFD-decompose accents → strip combining marks →
 * replace anything non-alphanumeric with `-` → trim leading/trailing dashes
 * → cap length.
 *
 * Examples:
 *   toSlug("Aero Clube de São Paulo")     → "aero-clube-de-sao-paulo"
 *   toSlug("ACAS – Santos!!")             → "acas-santos"
 *   toSlug("  é   ")                       → "e"
 *
 * The previous inline copy at components/schools/SchoolUpsertForm.tsx used
 * the same logic with a hardcoded Unicode-range regex. Centralized here so
 * any future form (e.g., admin lesson editor) gets the same behavior.
 */
export function toSlug(value: string, maxLength = 80): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // strip combining marks (accents)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, maxLength);
}
