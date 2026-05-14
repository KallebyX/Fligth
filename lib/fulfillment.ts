import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";
import { MAX_HEARTS } from "@/lib/hearts";
import { recordActivity } from "@/lib/activities";

type DB = SupabaseClient<Database, "public">;

const PRO_OUTFIT_SLUG = "pro-gold";

async function grantOutfit(
  supabase: DB,
  userId: string,
  slug: string,
  acquiredVia: "purchase" | "pro_unlock",
): Promise<boolean> {
  // PK is (user_id, outfit_slug) so re-running is safe.
  const { error } = await supabase.from("user_outfits").insert({
    user_id: userId,
    outfit_slug: slug,
    acquired_via: acquiredVia,
  });
  // Ignore unique violations; surface other errors.
  if (error && !/duplicate key|user_outfits_pkey/i.test(error.message)) {
    throw new Error(`grant_outfit_failed:${error.message}`);
  }
  return !error;
}

type Provider = "stripe" | "apple_iap" | "google_iap";

type FulfillByProviderRef = {
  providerRef: string;
};

type FulfillBySku = {
  userId: string;
  sku: string;
  provider: Provider;
  providerRef: string;
  amountCents?: number;
  currency?: string;
  paymentMethod?: string | null;
};

export type FulfillmentInput = FulfillByProviderRef | FulfillBySku;

function isBySku(input: FulfillmentInput): input is FulfillBySku {
  return "sku" in input;
}

// Idempotent. Two entry points:
//   - Stripe path: a `purchases` row already exists (created by startCheckout).
//     Call with { providerRef } and we look up product_id from the row.
//   - RevenueCat path: no row yet. Call with { userId, sku, provider,
//     providerRef, ... } and we create-or-update the row by provider_ref.
export async function fulfillPurchase(supabase: DB, input: FulfillmentInput) {
  let purchaseId: number;
  let productId: number;
  let userId: string;

  if (isBySku(input)) {
    // Resolve product by sku
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id")
      .eq("sku", input.sku)
      .single();
    if (prodErr || !product) throw new Error(`product_not_found:${input.sku}`);

    // Upsert the purchase row (idempotent on provider_ref).
    const existing = await supabase
      .from("purchases")
      .select("id, status, fulfilled_at")
      .eq("provider_ref", input.providerRef)
      .maybeSingle();

    if (existing.data?.status === "paid" && existing.data?.fulfilled_at) {
      return { alreadyFulfilled: true };
    }

    if (existing.data) {
      purchaseId = existing.data.id;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("purchases")
        .insert({
          user_id: input.userId,
          product_id: product.id,
          amount_cents: input.amountCents ?? 0,
          currency: (input.currency ?? "brl").toLowerCase(),
          provider: input.provider,
          provider_ref: input.providerRef,
          payment_method: input.paymentMethod ?? null,
          status: "pending",
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw new Error(`purchase_insert_failed:${insErr?.message}`);
      purchaseId = inserted.id;
    }

    productId = product.id;
    userId = input.userId;
  } else {
    // Stripe path: row created at checkout time.
    const { data: purchase, error: pErr } = await supabase
      .from("purchases")
      .select("id, status, fulfilled_at, product_id, user_id")
      .eq("provider_ref", input.providerRef)
      .single();
    if (pErr || !purchase) throw new Error(`purchase_not_found:${input.providerRef}`);
    if (purchase.status === "paid" && purchase.fulfilled_at) {
      return { alreadyFulfilled: true };
    }
    purchaseId = purchase.id;
    productId = purchase.product_id;
    userId = purchase.user_id;
  }

  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("kind, payload, sku")
    .eq("id", productId)
    .single();
  if (prodErr || !product) throw new Error(`product_not_found:${productId}`);

  const fulfilled: Record<string, unknown> = { sku: product.sku };

  switch (product.kind) {
    case "hearts_refill": {
      await supabase
        .from("user_stats")
        .update({ hearts: MAX_HEARTS, hearts_regen_at: null })
        .eq("user_id", userId);
      fulfilled.hearts_set_to = MAX_HEARTS;
      break;
    }
    case "hearts_unlimited": {
      const hours = (product.payload as { hours?: number })?.hours ?? 24;
      const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      await supabase
        .from("user_stats")
        .update({ hearts_unlimited_until: until, hearts: MAX_HEARTS, hearts_regen_at: null })
        .eq("user_id", userId);
      fulfilled.unlimited_until = until;
      break;
    }
    case "streak_freezes": {
      const count = (product.payload as { count?: number })?.count ?? 1;
      const { data: stats } = await supabase
        .from("user_stats")
        .select("streak_freezes")
        .eq("user_id", userId)
        .single();
      const next = (stats?.streak_freezes ?? 0) + count;
      await supabase
        .from("user_stats")
        .update({ streak_freezes: next })
        .eq("user_id", userId);
      fulfilled.streak_freezes_total = next;
      break;
    }
    case "pro_subscription": {
      // The canonical period end is set by the Stripe / RC subscription
      // webhook (invoice.period_end / RC expiration_at_ms). Here we set
      // pro_until optimistically so the user gets Pro features immediately;
      // the webhook overwrites with the authoritative value within seconds.
      const interval = (product.payload as { interval?: string })?.interval ?? "month";
      const trialDays = (product.payload as { trial_days?: number })?.trial_days ?? 0;
      const baseMs = interval === "year" ? 365 * 24 * 3600_000 : 30 * 24 * 3600_000;
      const until = new Date(Date.now() + baseMs + trialDays * 24 * 3600_000).toISOString();
      await supabase
        .from("user_stats")
        .update({ pro_until: until, pro_plan: interval === "year" ? "yearly" : "monthly" })
        .eq("user_id", userId);
      fulfilled.pro_until = until;
      fulfilled.pro_plan = interval === "year" ? "yearly" : "monthly";
      // Pro subscribers also unlock the pro-gold outfit (kept on cancel).
      const granted = await grantOutfit(supabase, userId, PRO_OUTFIT_SLUG, "pro_unlock");
      if (granted) {
        fulfilled.pro_outfit_unlocked = PRO_OUTFIT_SLUG;
        await recordActivity(userId, "outfit_unlocked", {
          outfit_slug: PRO_OUTFIT_SLUG,
          outfit_name: "Pro Dourado",
          via: "pro_subscription",
        });
      }
      break;
    }
    case "pro_lifetime": {
      const far = new Date(Date.now() + 100 * 365 * 24 * 3600_000).toISOString();
      await supabase
        .from("user_stats")
        .update({ pro_until: far, pro_plan: "lifetime" })
        .eq("user_id", userId);
      fulfilled.pro_until = far;
      fulfilled.pro_plan = "lifetime";
      const granted = await grantOutfit(supabase, userId, PRO_OUTFIT_SLUG, "pro_unlock");
      if (granted) {
        fulfilled.pro_outfit_unlocked = PRO_OUTFIT_SLUG;
        await recordActivity(userId, "outfit_unlocked", {
          outfit_slug: PRO_OUTFIT_SLUG,
          outfit_name: "Pro Dourado",
          via: "pro_lifetime",
        });
      }
      break;
    }
    case "mascot_outfit": {
      const slug = (product.payload as { outfit_slug?: string })?.outfit_slug;
      if (!slug) break;
      const granted = await grantOutfit(supabase, userId, slug, "purchase");
      fulfilled.outfit_slug = slug;
      if (granted) {
        // Read the friendly name for the activity message.
        const { data: outfit } = await supabase
          .from("mascot_outfits")
          .select("name, rarity")
          .eq("slug", slug)
          .maybeSingle();
        await recordActivity(userId, "outfit_unlocked", {
          outfit_slug: slug,
          outfit_name: outfit?.name,
          rarity: outfit?.rarity,
          via: "purchase_cash",
        });
      }
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
    .eq("id", purchaseId);

  return { alreadyFulfilled: false, fulfilled };
}
