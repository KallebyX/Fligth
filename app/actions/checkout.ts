"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { headers } from "next/headers";

export type StartCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function startCheckout(sku: string): Promise<StartCheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "unauthenticated" };

  // Look up the product via service client (products is RLS-protected for reads).
  const service = createServiceClient();
  const { data: product, error: pErr } = await service
    .from("products")
    .select("id, sku, name, description, kind, payload, price_cents, currency")
    .eq("sku", sku)
    .eq("active", true)
    .single();
  if (pErr || !product) return { ok: false, error: "product_not_found" };

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "fligth.vercel.app";
  const origin = `${proto}://${host}`;

  const stripe = getStripe();

  // Stripe Checkout auto-detects Apple Pay (Safari) and Google Pay (Chrome
  // on Android) on the Payment Request Button when allowed. PIX is enabled
  // for BRL accounts that opted in.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    payment_method_options: {
      card: { request_three_d_secure: "automatic" },
    },
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      product_sku: product.sku,
      product_id: String(product.id),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency,
          unit_amount: product.price_cents,
          product_data: {
            name: product.name,
            description: product.description ?? undefined,
          },
        },
      },
    ],
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop?canceled=1`,
    locale: "pt-BR",
    allow_promotion_codes: true,
  });

  if (!session.url) return { ok: false, error: "no_session_url" };

  // Pre-record the purchase row (status=pending) so the webhook can flip it.
  await service.from("purchases").insert({
    user_id: user.id,
    product_id: product.id,
    amount_cents: product.price_cents,
    currency: product.currency,
    provider: "stripe",
    provider_ref: session.id,
    status: "pending",
    fulfilled_payload: null,
  });

  return { ok: true, url: session.url };
}
