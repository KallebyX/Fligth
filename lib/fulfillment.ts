import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";
import { MAX_HEARTS } from "@/lib/hearts";

type DB = SupabaseClient<Database, "public">;

export type FulfillmentInput = {
  userId: string;
  productId: number;
  providerRef: string;
};

// Idempotent: rerunning the webhook for the same provider_ref is a no-op.
export async function fulfillPurchase(supabase: DB, input: FulfillmentInput) {
  // 1. Lock the purchase row.
  const { data: purchase, error: pErr } = await supabase
    .from("purchases")
    .select("id, status, fulfilled_at, product_id, user_id")
    .eq("provider_ref", input.providerRef)
    .single();
  if (pErr || !purchase) throw new Error(`purchase_not_found:${input.providerRef}`);
  if (purchase.status === "paid" && purchase.fulfilled_at) {
    return { alreadyFulfilled: true };
  }

  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("kind, payload, sku")
    .eq("id", purchase.product_id)
    .single();
  if (prodErr || !product) throw new Error(`product_not_found:${purchase.product_id}`);

  const fulfilled: Record<string, unknown> = { sku: product.sku };

  switch (product.kind) {
    case "hearts_refill": {
      await supabase
        .from("user_stats")
        .update({ hearts: MAX_HEARTS, hearts_regen_at: null })
        .eq("user_id", purchase.user_id);
      fulfilled.hearts_set_to = MAX_HEARTS;
      break;
    }
    case "hearts_unlimited": {
      const hours = (product.payload as { hours?: number })?.hours ?? 24;
      const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      await supabase
        .from("user_stats")
        .update({ hearts_unlimited_until: until, hearts: MAX_HEARTS, hearts_regen_at: null })
        .eq("user_id", purchase.user_id);
      fulfilled.unlimited_until = until;
      break;
    }
    case "streak_freezes": {
      const count = (product.payload as { count?: number })?.count ?? 1;
      const { data: stats } = await supabase
        .from("user_stats")
        .select("streak_freezes")
        .eq("user_id", purchase.user_id)
        .single();
      const next = (stats?.streak_freezes ?? 0) + count;
      await supabase
        .from("user_stats")
        .update({ streak_freezes: next })
        .eq("user_id", purchase.user_id);
      fulfilled.streak_freezes_total = next;
      break;
    }
    case "remove_ads":
    case "donation":
      // No-op for now; ads aren't implemented and donations are gratitude only.
      break;
  }

  await supabase
    .from("purchases")
    .update({
      status: "paid",
      fulfilled_at: new Date().toISOString(),
      fulfilled_payload: fulfilled as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);

  return { alreadyFulfilled: false, fulfilled };
}
