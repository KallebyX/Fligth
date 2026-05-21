import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
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
          Sentry.captureMessage("stripe checkout.session.completed missing metadata", {
            level: "warning",
            tags: { session_id: session.id, stripe_event: event.type },
          });
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

        await fulfillPurchase(supabase, { providerRef: session.id });
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillPurchase(supabase, { providerRef: session.id });
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

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        let userId = sub.metadata?.user_id ?? null;

        // Recovery path: when subscription comes in without user_id metadata
        // (rare — e.g. portal-created subs), look up the Stripe customer's
        // email and match to a Supabase auth user. Avoids dropping events.
        if (!userId && typeof sub.customer === "string") {
          try {
            const customer = await stripe.customers.retrieve(sub.customer);
            const email = (customer as Stripe.Customer).email;
            if (email) {
              const { data: matched } = await supabase.rpc("find_user_id_by_email", {
                p_email: email,
              });
              if (typeof matched === "string") userId = matched;
            }
          } catch (err) {
            Sentry.captureException(err, {
              tags: { stripe_event: event.type, sub_id: sub.id },
            });
          }
        }
        if (!userId) {
          Sentry.captureMessage("stripe subscription event missing user_id", {
            level: "warning",
            tags: { stripe_event: event.type, sub_id: sub.id },
          });
          break;
        }
        const status = mapSubStatus(sub.status);
        const item = sub.items.data[0];
        const periodEnd =
          item && typeof (item as { current_period_end?: number }).current_period_end === "number"
            ? new Date((item as { current_period_end: number }).current_period_end * 1000).toISOString()
            : null;
        const cancelAt = sub.cancel_at
          ? new Date(sub.cancel_at * 1000).toISOString()
          : null;
        const trialEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null;

        const productSku = sub.metadata?.product_sku ?? "pro_monthly";

        // Upsert subscriptions row.
        const existing = await supabase
          .from("subscriptions")
          .select("id")
          .eq("provider_ref", sub.id)
          .maybeSingle();
        if (existing.data) {
          await supabase
            .from("subscriptions")
            .update({
              status,
              current_period_end: periodEnd,
              cancel_at: cancelAt,
              trial_end: trialEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.data.id);
        } else {
          await supabase.from("subscriptions").insert({
            user_id: userId,
            provider: "stripe",
            provider_ref: sub.id,
            product_sku: productSku,
            status,
            current_period_end: periodEnd,
            cancel_at: cancelAt,
            trial_end: trialEnd,
          });
        }

        // Mirror to user_stats so the app can gate features cheaply.
        if (status === "active" || status === "trialing") {
          await supabase
            .from("user_stats")
            .update({
              pro_until: periodEnd,
              pro_plan: productSku === "pro_yearly" ? "yearly" : "monthly",
            })
            .eq("user_id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id ?? null;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("provider_ref", sub.id);
        if (userId) {
          // Don't strip Pro immediately — let the period end naturally via
          // pro_until. We do nothing else here.
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          (invoice as { subscription?: string | Stripe.Subscription }).subscription;
        if (typeof subId === "string") {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("provider_ref", subId);
        }
        break;
      }

      default:
        // No-op for unhandled types. Stripe will retry on 5xx so always 200 for known events.
        break;
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { stripe_event: event.type },
      extra: { event_id: event.id },
    });
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapSubStatus(
  s: Stripe.Subscription.Status,
): "trialing" | "active" | "past_due" | "canceled" | "expired" {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "expired";
    default:
      return "expired";
  }
}
