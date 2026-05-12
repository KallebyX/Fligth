// Outfit purchase via gems. Stripe-backed purchase (price_cents) is left
// for a follow-up — webhook plumbing lives in app/api/stripe/webhook.
//
// This file only handles the gems path: debits the user, grants the
// outfit, and emits an activity entry.

import { createServiceClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/activities";
import { getOutfit } from "@/lib/outfits/catalog";

export type PurchaseError =
  | "unauthenticated"
  | "outfit_not_found"
  | "already_owned"
  | "not_for_sale_with_gems"
  | "not_enough_gems"
  | "stripe_required"
  | "db_error";

export type PurchaseResult =
  | { ok: true; outfitSlug: string; gemsBalance: number }
  | { ok: false; error: PurchaseError };

export async function purchaseWithGems(
  userId: string,
  outfitSlug: string,
): Promise<PurchaseResult> {
  const supabase = createServiceClient();
  const outfit = await getOutfit(outfitSlug);
  if (!outfit) return { ok: false, error: "outfit_not_found" };
  if (outfit.price_gems == null || outfit.price_gems <= 0) {
    // Paid-only-with-cash outfits use the Stripe path.
    return { ok: false, error: "not_for_sale_with_gems" };
  }

  const { data: stats, error: sErr } = await supabase
    .from("user_stats")
    .select("gems")
    .eq("user_id", userId)
    .single();
  if (sErr || !stats) return { ok: false, error: "db_error" };

  if (stats.gems < outfit.price_gems) {
    return { ok: false, error: "not_enough_gems" };
  }

  const { data: owned } = await supabase
    .from("user_outfits")
    .select("outfit_slug")
    .eq("user_id", userId)
    .eq("outfit_slug", outfitSlug)
    .maybeSingle();
  if (owned) return { ok: false, error: "already_owned" };

  const newGems = stats.gems - outfit.price_gems;

  const { error: insertErr } = await supabase.from("user_outfits").insert({
    user_id: userId,
    outfit_slug: outfitSlug,
    acquired_via: "purchase",
  });
  if (insertErr) return { ok: false, error: "db_error" };

  await supabase
    .from("user_stats")
    .update({ gems: newGems })
    .eq("user_id", userId);

  await recordActivity(userId, "outfit_unlocked", {
    outfit_slug: outfitSlug,
    outfit_name: outfit.name,
    rarity: outfit.rarity,
    via: "purchase_gems",
  });

  return { ok: true, outfitSlug, gemsBalance: newGems };
}
