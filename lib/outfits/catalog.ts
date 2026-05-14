// Cached catalog reader so we don't refetch on every render.
// The catalog is small (<50 rows expected for the foreseeable future).

import { createServiceClient } from "@/lib/supabase/server";

export type OutfitTier = "free" | "prize" | "paid";
export type OutfitRarity = "common" | "rare" | "epic" | "legendary";

export type Outfit = {
  slug: string;
  name: string;
  description: string | null;
  tier: OutfitTier;
  rarity: OutfitRarity;
  price_gems: number | null;
  price_cents: number | null;
  stripe_price_id: string | null;
  asset_key: string;
  drop_weight: number;
};

let CACHE: { at: number; rows: Outfit[] } | null = null;
const TTL_MS = 60_000;

export async function loadOutfits(): Promise<Outfit[]> {
  if (CACHE && Date.now() - CACHE.at < TTL_MS) return CACHE.rows;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("mascot_outfits")
    .select(
      "slug, name, description, tier, rarity, price_gems, price_cents, stripe_price_id, asset_key, drop_weight",
    );
  const rows = (data ?? []) as Outfit[];
  CACHE = { at: Date.now(), rows };
  return rows;
}

export async function getOutfit(slug: string): Promise<Outfit | null> {
  const all = await loadOutfits();
  return all.find((o) => o.slug === slug) ?? null;
}

// Helper used by the roulette: returns outfits eligible for drops in the
// requested rarity tier (only `prize` tier, weight > 0). Excludes the
// starter outfit so we never give it as a "drop".
export async function getDropPool(
  rarities: OutfitRarity[],
): Promise<Outfit[]> {
  const all = await loadOutfits();
  return all.filter(
    (o) =>
      o.tier === "prize" &&
      o.drop_weight > 0 &&
      rarities.includes(o.rarity),
  );
}

export function pickWeighted<T extends { drop_weight: number }>(
  pool: T[],
): T | null {
  if (pool.length === 0) return null;
  const total = pool.reduce((acc, o) => acc + o.drop_weight, 0);
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const o of pool) {
    roll -= o.drop_weight;
    if (roll <= 0) return o;
  }
  return pool[pool.length - 1];
}
