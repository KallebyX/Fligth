"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export type OpenPortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function openStripePortal(): Promise<OpenPortalResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "unauthenticated" };

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("provider_ref, provider")
    .eq("user_id", user.id)
    .eq("provider", "stripe")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stripe = getStripe();

  let customerId: string | null = null;
  if (subRow?.provider_ref) {
    try {
      const sub = await stripe.subscriptions.retrieve(subRow.provider_ref);
      customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    } catch {
      // sub may have been deleted on Stripe — fall through to email lookup.
    }
  }

  if (!customerId) {
    const found = await stripe.customers.search({
      query: `email:"${user.email.replace(/"/g, '\\"')}"`,
      limit: 1,
    });
    customerId = found.data[0]?.id ?? null;
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
