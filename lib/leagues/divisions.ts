// The 10-tier league progression. Tier 1 is the floor (Bronze), tier 10 is
// the cap (Diamante). The chain is config-driven so the cron, the UI, and
// the promotion logic all stay in lockstep.

export type DivisionSlug =
  | "bronze"
  | "prata"
  | "ouro"
  | "safira"
  | "rubi"
  | "esmeralda"
  | "ametista"
  | "perola"
  | "obsidiana"
  | "diamante";

export type Division = {
  slug: DivisionSlug;
  name: string;
  color: string;
  bgClass: string; // Tailwind background class
  ring: string;    // Tailwind ring/border class
  tier: number;    // 1..10
};

export const DIVISIONS: Division[] = [
  { slug: "bronze",    name: "Bronze",    color: "#B45309", bgClass: "bg-[#B45309]", ring: "ring-[#B45309]", tier: 1 },
  { slug: "prata",     name: "Prata",     color: "#94A3B8", bgClass: "bg-[#94A3B8]", ring: "ring-[#94A3B8]", tier: 2 },
  { slug: "ouro",      name: "Ouro",      color: "#F59E0B", bgClass: "bg-[#F59E0B]", ring: "ring-[#F59E0B]", tier: 3 },
  { slug: "safira",    name: "Safira",    color: "#0EA5E9", bgClass: "bg-[#0EA5E9]", ring: "ring-[#0EA5E9]", tier: 4 },
  { slug: "rubi",      name: "Rubi",      color: "#DC2626", bgClass: "bg-[#DC2626]", ring: "ring-[#DC2626]", tier: 5 },
  { slug: "esmeralda", name: "Esmeralda", color: "#059669", bgClass: "bg-[#059669]", ring: "ring-[#059669]", tier: 6 },
  { slug: "ametista",  name: "Ametista",  color: "#9333EA", bgClass: "bg-[#9333EA]", ring: "ring-[#9333EA]", tier: 7 },
  { slug: "perola",    name: "Pérola",    color: "#E5E7EB", bgClass: "bg-[#E5E7EB]", ring: "ring-[#E5E7EB]", tier: 8 },
  { slug: "obsidiana", name: "Obsidiana", color: "#1E293B", bgClass: "bg-[#1E293B]", ring: "ring-[#1E293B]", tier: 9 },
  { slug: "diamante",  name: "Diamante",  color: "#67E8F9", bgClass: "bg-[#67E8F9]", ring: "ring-[#67E8F9]", tier: 10 },
];

export const DIVISION_BY_SLUG = new Map<DivisionSlug, Division>(
  DIVISIONS.map((d) => [d.slug, d]),
);

export function getDivision(slug: string | null | undefined): Division {
  if (!slug) return DIVISIONS[0];
  const d = DIVISION_BY_SLUG.get(slug as DivisionSlug);
  return d ?? DIVISIONS[0];
}

export function nextDivision(slug: DivisionSlug): DivisionSlug {
  const i = DIVISIONS.findIndex((d) => d.slug === slug);
  return DIVISIONS[Math.min(i + 1, DIVISIONS.length - 1)].slug;
}

export function prevDivision(slug: DivisionSlug): DivisionSlug {
  const i = DIVISIONS.findIndex((d) => d.slug === slug);
  return DIVISIONS[Math.max(i - 1, 0)].slug;
}

export const PROMOTE_TOP = 10;
export const RELEGATE_BOTTOM = 5;
