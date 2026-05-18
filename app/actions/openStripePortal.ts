"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export type OpenPortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

// Statuses where opening the Customer Portal is meaningful — the user has
// or had a real billing relationship. Excludes `canceled`, `incomplete`,
// `incomplete_expired`, and `unpaid` (those should land on /pro to start
// a fresh checkout, not into a portal that shows "no plan to manage").
const ACTIVE_LIKE: Array<"active" | "trialing" | "past_due"> = [
  "active",
  "trialing",
  "past_due",
];

export async function openStripePortal(): Promise<OpenPortalResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "unauthenticated" };

  // Only ever open the portal for users with an active-ish Stripe sub.
  // Previously we'd email-search Stripe for *any* customer record (which
  // includes abandoned-cart customers Stripe created on checkout init) and
  // open the portal even for non-paying users — confusing UX + wasted
  // API calls.
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("provider_ref, provider, status")
    .eq("user_id", user.id)
    .eq("provider", "stripe")
    .in("status", ACTIVE_LIKE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subRow?.provider_ref) {
    return { ok: false, error: "no_active_subscription" };
  }

  const stripe = getStripe();

  let customerId: string | null = null;
  try {
    const sub = await stripe.subscriptions.retrieve(subRow.provider_ref);
    customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  } catch {
    // Sub was deleted on Stripe but our row says active — data drift.
    // Bubble up so the manage page can prompt the user to re-subscribe.
    return { ok: false, error: "subscription_not_found_on_stripe" };
  }

  if (!customerId) return { ok: false, error: "no_customer" };

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "fligth.vercel.app";
  const origin = `${proto}://${host}`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/pro/manage`,
    });
    return { ok: true, url: session.url };
  } catch (err) {
    const e = err as { message?: string };
    return { ok: false, error: e?.message ?? "portal_failed" };
  }
}
