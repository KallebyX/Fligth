import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fulfillPurchase } from "@/lib/fulfillment";
import type Stripe from "stripe";

// Stripe needs the raw body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "missing_signature_or_secret" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productId = session.metadata?.product_id;
        if (!userId || !productId) {
          console.warn("[stripe webhook] checkout.session.completed missing metadata", session.id);
          break;
        }
        // Persist the actual payment method used (card, apple_pay, google_pay…)
        // when Stripe expands it back; for now we re-fetch the PaymentIntent.
        let paymentMethod: string | null = null;
        if (typeof session.payment_intent === "string") {
          try {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
              expand: ["payment_method"],
            });
            const pm = pi.payment_method;
            if (pm && typeof pm !== "string") {
              paymentMethod =
                pm.card?.wallet?.type ?? pm.type ?? null;
            }
          } catch (err) {
            console.warn("[stripe webhook] payment_intent retrieve failed", err);
          }
        }

        if (paymentMethod) {
          await supabase
            .from("purchases")
            .update({ payment_method: paymentMethod })
            .eq("provider_ref", session.id);
        }

        await fulfillPurchase(supabase, {
          userId,
          productId: Number(productId),
          providerRef: session.id,
        });
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productId = session.metadata?.product_id;
        if (userId && productId) {
          await fulfillPurchase(supabase, {
            userId,
            productId: Number(productId),
            providerRef: session.id,
          });
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase
          .from("purchases")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("provider_ref", session.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (typeof charge.payment_intent === "string") {
          // Find by payment_intent → checkout session metadata is preferred.
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: charge.payment_intent,
            limit: 1,
          });
          const session = sessions.data[0];
          if (session) {
            await supabase
              .from("purchases")
              .update({ status: "refunded", updated_at: new Date().toISOString() })
              .eq("provider_ref", session.id);
          }
        }
        break;
      }

      default:
        // No-op for unhandled types. Stripe will retry on 5xx so always 200 for known events.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
