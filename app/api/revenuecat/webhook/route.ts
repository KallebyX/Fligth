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
    product_id?: string;
    store?: "APP_STORE" | "MAC_APP_STORE" | "PLAY_STORE" | "AMAZON" | "STRIPE" | "PROMOTIONAL";
    transaction_id?: string;
    price?: number;
    currency?: string;
    environment?: "SANDBOX" | "PRODUCTION";
    purchased_at_ms?: number;
  };
};

const RC_PRODUCT_TO_SKU = Object.fromEntries(
  Object.entries(SKU_TO_RC_PRODUCT).map(([sku, id]) => [id, sku]),
);

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

  // Only fulfill on actual purchase events. Subscription/expiration paths are
  // a no-op for our consumable catalogue.
  const credittingEvents: RcEventType[] = ["INITIAL_PURCHASE", "NON_RENEWING_PURCHASE", "RENEWAL"];
  const refundEvents: RcEventType[] = ["REFUND", "CANCELLATION", "EXPIRATION"];

  try {
    if (credittingEvents.includes(ev.type)) {
      if (!ev.product_id || !ev.transaction_id) {
        return NextResponse.json({ error: "missing_product_or_tx" }, { status: 400 });
      }
      const sku = RC_PRODUCT_TO_SKU[ev.product_id];
      if (!sku) {
        // Unknown product — log and ack so RevenueCat doesn't retry forever.
        console.warn("[rc webhook] unknown product_id", ev.product_id);
        return NextResponse.json({ ok: true, ignored: "unknown_product" });
      }
      const provider = ev.store === "PLAY_STORE" ? "google_iap" : "apple_iap";
      await fulfillPurchase(supabase, {
        userId: ev.app_user_id,
        sku,
        provider,
        providerRef: ev.transaction_id,
        amountCents: ev.price ? Math.round(ev.price * 100) : 0,
        currency: (ev.currency ?? "brl").toLowerCase(),
        paymentMethod: ev.store === "PLAY_STORE" ? "google_pay" : "apple_pay",
      });
    } else if (refundEvents.includes(ev.type)) {
      if (ev.transaction_id) {
        await supabase
          .from("purchases")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("provider_ref", ev.transaction_id);
      }
    } else if (ev.type === "TEST") {
      // RevenueCat sends TEST events from the dashboard's "Send test event" button.
      return NextResponse.json({ ok: true, test: true });
    }
    // All other event types are intentionally ignored.
  } catch (err) {
    console.error("[rc webhook] handler error", err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
