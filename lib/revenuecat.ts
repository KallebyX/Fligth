"use client";

import {
  Purchases,
  LOG_LEVEL,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from "@revenuecat/purchases-capacitor";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";

// Map our SKUs → store product identifiers. Same identifier MUST be
// configured in App Store Connect AND Google Play Console. RevenueCat
// then ties everything together so we have a single vocabulary across
// web (Stripe) and native (StoreKit / Play Billing).
//
// Naming convention:
//   br.com.capitaolori.app.<sku>
// (matches our bundle id prefix so App Store Connect groups them
// cleanly under our app.)
export const SKU_TO_RC_PRODUCT: Record<string, string> = {
  // Consumables
  hearts_refill: "br.com.capitaolori.app.hearts_refill",
  hearts_unlimited_24h: "br.com.capitaolori.app.hearts_unlimited_24h",
  hearts_unlimited_7d: "br.com.capitaolori.app.hearts_unlimited_7d",
  streak_freeze_3: "br.com.capitaolori.app.streak_freeze_3",

  // Subscriptions
  pro_monthly: "br.com.capitaolori.app.pro.monthly",
  pro_yearly: "br.com.capitaolori.app.pro.yearly",

  // Non-renewing (one-shot lifetime unlock)
  pro_lifetime: "br.com.capitaolori.app.pro.lifetime",
};

// RevenueCat "entitlement" identifier configured in the dashboard.
// Every Pro product (monthly/yearly/lifetime) is attached to this
// single entitlement so the client just checks `entitlements.active.pro`.
export const PRO_ENTITLEMENT_ID = "pro";

let _initialized = false;
let _userId: string | null = null;

export async function ensureRevenueCat(userId: string): Promise<void> {
  if (_initialized && _userId === userId) return;
  const platform = detectPlatform();
  if (platform === "web") return; // RevenueCat Capacitor is iOS+Android only.

  const iosKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY;
  const androidKey = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY;
  const apiKey = platform === "ios" ? iosKey : androidKey;
  if (!apiKey) {
    console.warn("[revenuecat] missing public API key for platform", platform);
    return;
  }

  if (_initialized && _userId !== userId) {
    // Different user logged in — re-identify so RC ties entitlements
    // and webhook events to the right Supabase user.
    try {
      await Purchases.logIn({ appUserID: userId });
      _userId = userId;
    } catch (err) {
      console.warn("[revenuecat] logIn failed", err);
    }
    return;
  }

  await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
  await Purchases.configure({ apiKey, appUserID: userId });
  _initialized = true;
  _userId = userId;
}

export async function getRcPackages(): Promise<PurchasesPackage[]> {
  if (!isNativeAndEnabled()) return [];
  try {
    const { current } = await Purchases.getOfferings();
    return current?.availablePackages ?? [];
  } catch (err) {
    console.warn("[revenuecat] getOfferings failed", err);
    return [];
  }
}

/** Returns the StoreKit-localized price string for a given SKU, e.g.
 * `"R$ 19,90"`, `"$3.99"`, etc. Falls back to null if the SDK isn't
 * initialized or the product isn't available in the current storefront. */
export async function getNativePrice(sku: string): Promise<string | null> {
  if (!isNativeAndEnabled()) return null;
  const productId = SKU_TO_RC_PRODUCT[sku];
  if (!productId) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.find(
      (p) => p.product.identifier === productId,
    );
    if (pkg) return pkg.product.priceString;
    // Fall back to fetching the product directly.
    const { products } = await Purchases.getProducts({ productIdentifiers: [productId] });
    return products[0]?.priceString ?? null;
  } catch {
    return null;
  }
}

/** Batched variant — fewer roundtrips when /pro renders 3 plans. */
export async function getNativePrices(
  skus: string[],
): Promise<Record<string, string>> {
  if (!isNativeAndEnabled()) return {};
  const out: Record<string, string> = {};
  try {
    const productIds = skus
      .map((s) => SKU_TO_RC_PRODUCT[s])
      .filter((id): id is string => !!id);
    if (productIds.length === 0) return {};

    const offerings = await Purchases.getOfferings();
    const fromOfferings = offerings.current?.availablePackages ?? [];
    for (const sku of skus) {
      const productId = SKU_TO_RC_PRODUCT[sku];
      if (!productId) continue;
      const pkg = fromOfferings.find((p) => p.product.identifier === productId);
      if (pkg) out[sku] = pkg.product.priceString;
    }

    const missing = productIds.filter(
      (id) => !Object.values(SKU_TO_RC_PRODUCT).some(
        (rcId) => rcId === id && Object.keys(out).some((sku) => SKU_TO_RC_PRODUCT[sku] === id),
      ),
    );
    if (missing.length > 0) {
      const { products } = await Purchases.getProducts({ productIdentifiers: missing });
      for (const sku of skus) {
        if (out[sku]) continue;
        const productId = SKU_TO_RC_PRODUCT[sku];
        const p = products.find((pp: PurchasesStoreProduct) => pp.identifier === productId);
        if (p) out[sku] = p.priceString;
      }
    }
  } catch (err) {
    console.warn("[revenuecat] getNativePrices failed", err);
  }
  return out;
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
      const { products } = await Purchases.getProducts({
        productIdentifiers: [productId],
      });
      const product = products[0];
      if (!product) return { ok: false, error: "product_not_found_on_store" };
      await Purchases.purchaseStoreProduct({ product });
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

/** Returns true when the user currently owns the Pro entitlement
 * according to RevenueCat's local cache (synced with StoreKit /
 * Play Billing on launch). Use this to short-circuit UI before the
 * server-side `pro_until` refresh lands. */
export async function hasProEntitlementLocal(): Promise<{
  isPro: boolean;
  expiresAt: string | null;
}> {
  if (!isNativeAndEnabled()) return { isPro: false, expiresAt: null };
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const ent = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
    if (!ent) return { isPro: false, expiresAt: null };
    return { isPro: true, expiresAt: ent.expirationDate ?? null };
  } catch {
    return { isPro: false, expiresAt: null };
  }
}

// App Store guideline 3.1.1 requires every app with IAP to expose a
// "Restore Purchases" button. RevenueCat surfaces all active entitlements
// owned by the current Apple ID / Google account; the RevenueCat webhook
// fan-out then syncs `user_stats.pro_until` server-side.
export async function restoreNativePurchases(): Promise<
  | { ok: true; restored: number; hasPro: boolean }
  | { ok: false; error: string }
> {
  if (!isNativeAndEnabled()) return { ok: false, error: "iap_disabled" };
  try {
    const info = await Purchases.restorePurchases();
    const active = info.customerInfo?.entitlements?.active ?? {};
    const hasPro = !!active[PRO_ENTITLEMENT_ID];
    return { ok: true, restored: Object.keys(active).length, hasPro };
  } catch (err) {
    const e = err as { message?: string };
    return { ok: false, error: e?.message ?? "restore_failed" };
  }
}

/** Open the platform-native subscription management screen.
 *
 *   iOS  → itms-apps URL opens "Subscriptions" inside the App Store app
 *   Web  → returns false; caller should fall back to Stripe portal */
export async function openNativeManageSubscriptions(): Promise<boolean> {
  if (!isNativeAndEnabled()) return false;
  try {
    const { Browser } = await import("@capacitor/browser");
    const platform = detectPlatform();
    // Apple's deep link for the user's subscriptions page. Same scheme
    // works for both App Store and Settings → Apple ID → Subscriptions
    // because iOS will route to whichever is available.
    const url =
      platform === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    await Browser.open({ url });
    return true;
  } catch (err) {
    console.warn("[revenuecat] open manage subscriptions failed", err);
    return false;
  }
}
