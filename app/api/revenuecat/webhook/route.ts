import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fulfillPurchase } from "@/lib/fulfillment";
import { SKU_TO_RC_PRODUCT } from "@/lib/revenuecat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RevenueCat → server webhook.
// Setup: https://www.revenuecat.com/docs/integrations/webhooks
// Auth: RevenueCat sends a custom Authorization header that you define in the
// dashboard. We mirror that into REVENUECAT_WEBHOOK_TOKEN. Anything missing or
// mismatched gets a 401.

type RcEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "NON_RENEWING_PURCHASE"
  | "PRODUCT_CHANGE"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "BILLING_ISSUE"
  | "SUBSCRIBER_ALIAS"
  | "SUBSCRIPTION_PAUSED"
  | "EXPIRATION"
  | "TRANSFER"
  | "REFUND"
  | "TEST";

type RcEvent = {
  api_version: string;
  event: {
    id: string;
    type: RcEventType;
    app_user_id: string;
    original_app_user_id?: string;
    aliases?: string[];
    product_id?: string;
    entitlement_ids?: string[];
    store?: "APP_STORE" | "MAC_APP_STORE" | "PLAY_STORE" | "AMAZON" | "STRIPE" | "PROMOTIONAL";
    transaction_id?: string;
    original_transaction_id?: string;
    price?: number;
    price_in_purchased_currency?: number;
    currency?: string;
    environment?: "SANDBOX" | "PRODUCTION";
    purchased_at_ms?: number;
    expiration_at_ms?: number | null;
    period_type?: "NORMAL" | "TRIAL" | "INTRO";
    cancel_reason?: string;
    is_trial_conversion?: boolean;
  };
};

const RC_PRODUCT_TO_SKU = Object.fromEntries(
  Object.entries(SKU_TO_RC_PRODUCT).map(([sku, id]) => [id, sku]),
);

function providerFromStore(store?: string): "apple_iap" | "google_iap" {
  return store === "PLAY_STORE" ? "google_iap" : "apple_iap";
}

function paymentMethodFromStore(store?: string): string {
  return store === "PLAY_STORE" ? "google_pay" : "apple_pay";
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization");
  const expected = process.env.REVENUECAT_WEBHOOK_TOKEN;
  if (!expected || token !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: RcEvent;
  try {
    payload = (await request.json()) as RcEvent;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const ev = payload.event;
  if (!ev || !ev.app_user_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fulfill on real purchase events. Subscription renewals also re-credit
  // pro_until (the period rolls forward).
  const creditingEvents: RcEventType[] = [
    "INITIAL_PURCHASE",
    "NON_RENEWING_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "PRODUCT_CHANGE",
  ];
  const downgradeEvents: RcEventType[] = ["EXPIRATION", "REFUND"];
  const stillActiveCancelEvents: RcEventType[] = ["CANCELLATION"];

  try {
    if (creditingEvents.includes(ev.type)) {
      if (!ev.product_id || !ev.transaction_id) {
        return NextResponse.json({ error: "missing_product_or_tx" }, { status: 400 });
      }
      const sku = RC_PRODUCT_TO_SKU[ev.product_id];
      if (!sku) {
        // Unknown product — log and ack so RevenueCat doesn't retry forever.
        console.warn("[rc webhook] unknown product_id", ev.product_id);
        return NextResponse.json({ ok: true, ignored: "unknown_product" });
      }
      const provider = providerFromStore(ev.store);

      // Fulfill the consumable / outfit / pro-grant.
      await fulfillPurchase(supabase, {
        userId: ev.app_user_id,
        sku,
        provider,
        providerRef: ev.transaction_id,
        amountCents: ev.price_in_purchased_currency
          ? Math.round(ev.price_in_purchased_currency * 100)
          : ev.price
            ? Math.round(ev.price * 100)
            : 0,
        currency: (ev.currency ?? "brl").toLowerCase(),
        paymentMethod: paymentMethodFromStore(ev.store),
      });

      // For subscriptions, also keep public.subscriptions in sync so the
      // /pro/manage page shows the right period_end without polling RC.
      if (sku === "pro_monthly" || sku === "pro_yearly") {
        const periodEnd = ev.expiration_at_ms
          ? new Date(ev.expiration_at_ms).toISOString()
          : null;
        const trialing = ev.period_type === "TRIAL";
        // Trial-end is the same as period_end when in trial; null otherwise.
        const trialEnd = trialing ? periodEnd : null;
        await supabase.from("subscriptions").upsert(
          {
            user_id: ev.app_user_id,
            provider,
            provider_ref: ev.original_transaction_id ?? ev.transaction_id,
            product_sku: sku,
            status: trialing ? "trialing" : "active",
            current_period_end: periodEnd,
            trial_end: trialEnd,
            cancel_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider,provider_ref" },
        );

        // pro_until reflects the real Apple-issued expiration so we revoke
        // exactly at the right moment.
        if (periodEnd) {
          await supabase
            .from("user_stats")
            .update({
              pro_until: periodEnd,
              pro_plan: sku === "pro_yearly" ? "yearly" : "monthly",
            })
            .eq("user_id", ev.app_user_id);
        }
      } else if (sku === "pro_lifetime") {
        // Lifetime: record a subscriptions row even though it doesn't
        // renew, so the manage page knows the provider.
        await supabase.from("subscriptions").upsert(
          {
            user_id: ev.app_user_id,
            provider,
            provider_ref: ev.original_transaction_id ?? ev.transaction_id,
            product_sku: sku,
            status: "active",
            current_period_end: null,
            trial_end: null,
            cancel_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider,provider_ref" },
        );
      }
    } else if (stillActiveCancelEvents.includes(ev.type)) {
      // User canceled but still has access until expiration. Mark the
      // subscriptions row "canceled" + set cancel_at so manage page can
      // show "Acesso até X". Do NOT touch pro_until — let it run out.
      if (ev.transaction_id || ev.original_transaction_id) {
        const ref = ev.original_transaction_id ?? ev.transaction_id;
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at: ev.expiration_at_ms
              ? new Date(ev.expiration_at_ms).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_ref", ref!);
      }
    } else if (downgradeEvents.includes(ev.type)) {
      const ref = ev.original_transaction_id ?? ev.transaction_id ?? null;
      if (ref) {
        // Mark purchase refunded for audit trail (no-op if it wasn't a
        // one-shot purchase).
        await supabase
          .from("purchases")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("provider_ref", ref);
        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("provider_ref", ref);
      }

      // Revoke Pro: any time we receive a real EXPIRATION or REFUND for
      // a Pro product, we cap pro_until at now so the user loses access.
      const skuFromProduct = ev.product_id ? RC_PRODUCT_TO_SKU[ev.product_id] : null;
      const isPro =
        skuFromProduct === "pro_monthly" ||
        skuFromProduct === "pro_yearly" ||
        skuFromProduct === "pro_lifetime";
      if (isPro && ev.app_user_id) {
        const nowIso = new Date().toISOString();
        await supabase
          .from("user_stats")
          .update({ pro_until: nowIso })
          .eq("user_id", ev.app_user_id)
          // Only revoke if the user's stored pro_until is in the future.
          // Avoid stomping a fresh purchase that arrived first.
          .gt("pro_until", nowIso);
      }
    } else if (ev.type === "BILLING_ISSUE") {
      const ref = ev.original_transaction_id ?? ev.transaction_id ?? null;
      if (ref) {
        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("provider_ref", ref);
      }
    } else if (ev.type === "TEST") {
      // RevenueCat sends TEST events from the dashboard's "Send test event"
      // button. Ack with metadata so the dashboard shows it as delivered.
      return NextResponse.json({ ok: true, test: true });
    }
    // All other event types are intentionally ignored.
  } catch (err) {
    console.error("[rc webhook] handler error", err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
