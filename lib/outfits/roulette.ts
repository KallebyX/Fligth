// Daily free roulette: 24h cooldown, drops only `prize` outfits of
// common/rare rarity. Duplicates trade for consolation gems.

import { createServiceClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/activities";
import { getDropPool, pickWeighted, type Outfit } from "@/lib/outfits/catalog";

export type SpinError =
  | "unauthenticated"
  | "cooldown_active"
  | "empty_pool"
  | "db_error";

export type SpinResult =
  | {
      ok: true;
      outfit: Outfit;
      isDuplicate: boolean;
      gemsAwarded: number;
      nextSpinAt: string;
    }
  | { ok: false; error: SpinError; nextSpinAt?: string };

export const ROULETTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const ROULETTE_DUPLICATE_GEMS = 20;
export const ROULETTE_RARITIES = ["common", "rare"] as const;

export async function spinRoulette(userId: string): Promise<SpinResult> {
  const supabase = createServiceClient();
  const now = new Date();

  const { data: stats, error: statsErr } = await supabase
    .from("user_stats")
    .select("gems, last_spin_at")
    .eq("user_id", userId)
    .single();
  if (statsErr || !stats) return { ok: false, error: "db_error" };

  const last = stats.last_spin_at ? new Date(stats.last_spin_at).getTime() : 0;
  const earliestNext = last + ROULETTE_COOLDOWN_MS;
  if (last && earliestNext > now.getTime()) {
    return {
      ok: false,
      error: "cooldown_active",
      nextSpinAt: new Date(earliestNext).toISOString(),
    };
  }

  const pool = await getDropPool([...ROULETTE_RARITIES]);
  const outfit = pickWeighted(pool);
  if (!outfit) return { ok: false, error: "empty_pool" };

  const { data: existing } = await supabase
    .from("user_outfits")
    .select("outfit_slug")
    .eq("user_id", userId)
    .eq("outfit_slug", outfit.slug)
    .maybeSingle();

  const isDuplicate = Boolean(existing);
  const gemsAwarded = isDuplicate ? ROULETTE_DUPLICATE_GEMS : 0;

  if (!isDuplicate) {
    await supabase.from("user_outfits").insert({
      user_id: userId,
      outfit_slug: outfit.slug,
      acquired_via: "roulette",
    });
    await recordActivity(userId, "outfit_unlocked", {
      outfit_slug: outfit.slug,
      outfit_name: outfit.name,
      rarity: outfit.rarity,
      via: "roulette",
    });
  }

  const newGems = stats.gems + gemsAwarded;
  await supabase
    .from("user_stats")
    .update({ gems: newGems, last_spin_at: now.toISOString() })
    .eq("user_id", userId);

  return {
    ok: true,
    outfit,
    isDuplicate,
    gemsAwarded,
    nextSpinAt: new Date(now.getTime() + ROULETTE_COOLDOWN_MS).toISOString(),
  };
}

export function rouletteAvailableAt(lastSpinAt: string | null): {
  ready: boolean;
  nextAt: string | null;
} {
  if (!lastSpinAt) return { ready: true, nextAt: null };
  const next = new Date(lastSpinAt).getTime() + ROULETTE_COOLDOWN_MS;
  if (next <= Date.now()) return { ready: true, nextAt: null };
  return { ready: false, nextAt: new Date(next).toISOString() };
}
