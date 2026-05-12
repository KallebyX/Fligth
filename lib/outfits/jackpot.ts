// Paid jackpot: 50 gems, 1h cooldown, drops only epic/legendary outfits.
// Duplicates trade for a chunkier consolation since the spin cost is real.

import { createServiceClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/activities";
import { getDropPool, pickWeighted, type Outfit } from "@/lib/outfits/catalog";

export const JACKPOT_COST_GEMS = 50;
export const JACKPOT_COOLDOWN_MS = 60 * 60 * 1000;
export const JACKPOT_DUPLICATE_GEMS = 25;
export const JACKPOT_RARITIES = ["epic", "legendary"] as const;

export type JackpotError =
  | "unauthenticated"
  | "cooldown_active"
  | "not_enough_gems"
  | "empty_pool"
  | "db_error";

export type JackpotResult =
  | {
      ok: true;
      outfit: Outfit;
      isDuplicate: boolean;
      gemsCharged: number;
      gemsRefunded: number;
      gemsBalance: number;
      nextSpinAt: string;
    }
  | { ok: false; error: JackpotError; nextSpinAt?: string };

export async function spinJackpot(userId: string): Promise<JackpotResult> {
  const supabase = createServiceClient();
  const now = new Date();

  const { data: stats, error: statsErr } = await supabase
    .from("user_stats")
    .select("gems, last_jackpot_at")
    .eq("user_id", userId)
    .single();
  if (statsErr || !stats) return { ok: false, error: "db_error" };

  const last = stats.last_jackpot_at
    ? new Date(stats.last_jackpot_at).getTime()
    : 0;
  const earliestNext = last + JACKPOT_COOLDOWN_MS;
  if (last && earliestNext > now.getTime()) {
    return {
      ok: false,
      error: "cooldown_active",
      nextSpinAt: new Date(earliestNext).toISOString(),
    };
  }

  if (stats.gems < JACKPOT_COST_GEMS) {
    return { ok: false, error: "not_enough_gems" };
  }

  const pool = await getDropPool([...JACKPOT_RARITIES]);
  const outfit = pickWeighted(pool);
  if (!outfit) return { ok: false, error: "empty_pool" };

  const { data: existing } = await supabase
    .from("user_outfits")
    .select("outfit_slug")
    .eq("user_id", userId)
    .eq("outfit_slug", outfit.slug)
    .maybeSingle();
  const isDuplicate = Boolean(existing);
  const refund = isDuplicate ? JACKPOT_DUPLICATE_GEMS : 0;

  if (!isDuplicate) {
    await supabase.from("user_outfits").insert({
      user_id: userId,
      outfit_slug: outfit.slug,
      acquired_via: "jackpot",
    });
    await recordActivity(userId, "jackpot_win", {
      outfit_slug: outfit.slug,
      outfit_name: outfit.name,
      rarity: outfit.rarity,
    });
  }

  const newGems = stats.gems - JACKPOT_COST_GEMS + refund;
  await supabase
    .from("user_stats")
    .update({ gems: newGems, last_jackpot_at: now.toISOString() })
    .eq("user_id", userId);

  return {
    ok: true,
    outfit,
    isDuplicate,
    gemsCharged: JACKPOT_COST_GEMS,
    gemsRefunded: refund,
    gemsBalance: newGems,
    nextSpinAt: new Date(now.getTime() + JACKPOT_COOLDOWN_MS).toISOString(),
  };
}

export function jackpotAvailableAt(lastAt: string | null): {
  ready: boolean;
  nextAt: string | null;
} {
  if (!lastAt) return { ready: true, nextAt: null };
  const next = new Date(lastAt).getTime() + JACKPOT_COOLDOWN_MS;
  if (next <= Date.now()) return { ready: true, nextAt: null };
  return { ready: false, nextAt: new Date(next).toISOString() };
}
