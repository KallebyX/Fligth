"use client";

import { Purchases, LOG_LEVEL, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";

// Map your Stripe SKUs → RevenueCat product identifiers. Set the same
// product ID in App Store Connect AND Google Play Console; this keeps a
// single SKU vocabulary across web (Stripe), iOS (StoreKit) and Android
// (Play Billing).
export const SKU_TO_RC_PRODUCT: Record<string, string> = {
  hearts_refill: "br.com.capitaolori.hearts_refill",
  hearts_unlimited_24h: "br.com.capitaolori.hearts_unlimited_24h",
  hearts_unlimited_7d: "br.com.capitaolori.hearts_unlimited_7d",
  streak_freeze_3: "br.com.capitaolori.streak_freeze_3",
};

let _initialized = false;

export async function ensureRevenueCat(userId: string): Promise<void> {
  if (_initialized) return;
  const platform = detectPlatform();
  if (platform === "web") return; // RevenueCat Capacitor is iOS+Android only.

  const iosKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY;
  const androidKey = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY;
  const apiKey = platform === "ios" ? iosKey : androidKey;
  if (!apiKey) {
    console.warn("[revenuecat] missing public API key for platform", platform);
    return;
  }

  await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
  await Purchases.configure({ apiKey, appUserID: userId });
  _initialized = true;
}

export async function getRcPackages(): Promise<PurchasesPackage[]> {
  if (!isNativeAndEnabled()) return [];
  const { current } = await Purchases.getOfferings();
  return current?.availablePackages ?? [];
}

export async function purchaseSku(
  sku: string,
): Promise<{ ok: true } | { ok: false; error: string; userCancelled?: boolean }> {
  if (!isNativeAndEnabled()) return { ok: false, error: "iap_disabled" };
  const productId = SKU_TO_RC_PRODUCT[sku];
  if (!productId) return { ok: false, error: "unknown_sku" };

  try {
    // Prefer purchasing the matched RevenueCat package (cheaper + carries the
    // store offering metadata). Fall back to direct product purchase.
    const packages = await getRcPackages();
    const pkg = packages.find((p) => p.product.identifier === productId);
    if (pkg) {
      await Purchases.purchasePackage({ aPackage: pkg });
    } else {
      await Purchases.purchaseStoreProduct({
        product: {
          identifier: productId,
          // The full StoreProduct object would be richer; for now we hint the
          // SDK and let it resolve from the store cache.
        } as never,
      });
    }
    return { ok: true };
  } catch (err) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e?.userCancelled) return { ok: false, error: "cancelled", userCancelled: true };
    return { ok: false, error: e?.message ?? "purchase_failed" };
  }
}

function isNativeAndEnabled(): boolean {
  const p = detectPlatform();
  return (p === "ios" || p === "android") && NATIVE_IAP_ENABLED;
}

// App Store guideline 3.1.1 requires every app with IAP to expose a
// "Restore Purchases" button. RevenueCat surfaces all active entitlements
// owned by the current Apple ID / Google account; the RevenueCat webhook
// fan-out then syncs `user_stats.pro_until` server-side.
export async function restoreNativePurchases(): Promise<
  | { ok: true; restored: number }
  | { ok: false; error: string }
> {
  if (!isNativeAndEnabled()) return { ok: false, error: "iap_disabled" };
  try {
    const info = await Purchases.restorePurchases();
    const active = info.customerInfo?.entitlements?.active ?? {};
    return { ok: true, restored: Object.keys(active).length };
  } catch (err) {
    const e = err as { message?: string };
    return { ok: false, error: e?.message ?? "restore_failed" };
  }
}
