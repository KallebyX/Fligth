"use client";

import { useNativePrice } from "./NativePriceProvider";

/**
 * Displays the localized StoreKit / Play Billing price when the user
 * is in the native shell. Falls back to the server-rendered price
 * (computed from products.price_cents) on web.
 */
export function PriceLabel({
  sku,
  fallback,
  className,
}: {
  sku: string;
  /** Server-side fallback (BRL string from products.price_cents). */
  fallback: string;
  className?: string;
}) {
  const { nativePrice, isNative, ready } = useNativePrice(sku);

  // While native and not yet resolved, show fallback (avoids flicker).
  const label = isNative && ready && nativePrice ? nativePrice : fallback;
  return <span className={className}>{label}</span>;
}
