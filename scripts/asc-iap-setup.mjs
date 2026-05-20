#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Create the 7 In-App Purchases in App Store Connect via the App Store
 * Connect API (saves ~30 minutes of dashboard clicking).
 *
 * USAGE
 *   APP_STORE_CONNECT_KEY_ID=xxx \
 *   APP_STORE_CONNECT_ISSUER_ID=xxx \
 *   APP_STORE_CONNECT_KEY=$(cat AuthKey_XXX.p8) \
 *     node scripts/asc-iap-setup.mjs
 *
 *   (Use the same key from fastlane env. The .p8 contents go in
 *   APP_STORE_CONNECT_KEY as a string, including the BEGIN/END lines.)
 *
 *   Add --dry-run to print what would be created without calling the API.
 *
 * What this does:
 *   1. Authenticates against ASC API with a JWT signed by the .p8.
 *   2. Finds the app by bundle id `br.com.capitaolori.app`.
 *   3. Creates a Subscription Group `CMTE Lorí Pro` if missing.
 *   4. Creates the 3 Pro products as Auto-Renewable Subscriptions
 *      (`pro_monthly`, `pro_yearly`) and a Non-Consumable (`pro_lifetime`).
 *   5. Creates the 4 consumables.
 *   6. Adds pt-BR / en-US / es-ES localizations on each.
 *   7. Sets price tiers (BRL reference; Apple does FX automatically).
 *
 * What this DOES NOT do:
 *   • Submit the IAPs for review — that happens with the build submission.
 *   • Set introductory free-trial offers (Apple requires that to be done
 *     manually after the subscription is created and approved at least
 *     once). The docs/APP-STORE-LAUNCH.md §B2 covers manual setup.
 *   • Attach screenshots — App Reviewer typically doesn't need IAP-level
 *     screenshots if the paywall is obvious. Set per product manually if
 *     Apple ever rejects on this point.
 *
 * Idempotent: re-running just updates whatever already exists.
 */

import { createSign } from "node:crypto";

const KEY_ID = process.env.APP_STORE_CONNECT_KEY_ID;
const ISSUER_ID = process.env.APP_STORE_CONNECT_ISSUER_ID;
const KEY = process.env.APP_STORE_CONNECT_KEY;
const BUNDLE_ID = "br.com.capitaolori.app";
const DRY = process.argv.includes("--dry-run");

if (!KEY_ID || !ISSUER_ID || !KEY) {
  console.error(
    "Missing env. Need APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID, APP_STORE_CONNECT_KEY.",
  );
  process.exit(1);
}

// --- Product catalogue ----------------------------------------------------

const SUBSCRIPTION_GROUP_REF = "cmte_lori_pro";
const SUBSCRIPTION_GROUP_NAME = "CMTE Lorí Pro";

const SUBSCRIPTIONS = [
  {
    productId: "br.com.capitaolori.app.pro.monthly",
    referenceName: "CMTE Lorí Pro Mensal",
    subscriptionPeriod: "ONE_MONTH",
    priceTier: "19", // ~R$ 19.90
    locales: {
      "pt-BR": { name: "Pro Mensal", description: "Vidas ilimitadas, simulados extras e estatísticas. Renova mensal." },
      "en-US": { name: "Pro Monthly", description: "Unlimited hearts, extra mock exams and analytics. Renews monthly." },
      "es-ES": { name: "Pro Mensual", description: "Vidas ilimitadas, simulacros extras y estadísticas. Renueva mensual." },
    },
  },
  {
    productId: "br.com.capitaolori.app.pro.yearly",
    referenceName: "CMTE Lorí Pro Anual",
    subscriptionPeriod: "ONE_YEAR",
    priceTier: "119", // ~R$ 119
    locales: {
      "pt-BR": { name: "Pro Anual", description: "Mesmo do mensal por menos de R$ 10/mês. Renova anual." },
      "en-US": { name: "Pro Yearly", description: "Same as monthly for less than R$ 10/month. Renews yearly." },
      "es-ES": { name: "Pro Anual", description: "Lo mismo del mensual por menos de R$ 10/mes. Renueva anual." },
    },
  },
];

const NON_CONSUMABLE = {
  productId: "br.com.capitaolori.app.pro.lifetime",
  referenceName: "CMTE Lorí Pro Vitalício",
  priceTier: "299",
  locales: {
    "pt-BR": { name: "Pro Vitalício", description: "Pague uma vez, use pra sempre. Sem renovação." },
    "en-US": { name: "Pro Lifetime", description: "One-time purchase, forever access. No renewal." },
    "es-ES": { name: "Pro Vitalicio", description: "Pago único, acceso para siempre. Sin renovación." },
  },
};

const CONSUMABLES = [
  {
    productId: "br.com.capitaolori.app.hearts_refill",
    referenceName: "Refil de vidas",
    priceTier: "5",
    locales: {
      "pt-BR": { name: "Refil de vidas", description: "Recarrega todas as 5 vidas imediatamente." },
      "en-US": { name: "Hearts refill", description: "Refills all 5 hearts immediately." },
      "es-ES": { name: "Recarga de vidas", description: "Recarga las 5 vidas inmediatamente." },
    },
  },
  {
    productId: "br.com.capitaolori.app.hearts_unlimited_24h",
    referenceName: "Vidas ilimitadas 24h",
    priceTier: "15",
    locales: {
      "pt-BR": { name: "Vidas ilimitadas — 24h", description: "Erre à vontade pelas próximas 24h." },
      "en-US": { name: "Unlimited hearts — 24h", description: "Miss freely for the next 24 hours." },
      "es-ES": { name: "Vidas ilimitadas — 24h", description: "Falla sin límite por 24 horas." },
    },
  },
  {
    productId: "br.com.capitaolori.app.hearts_unlimited_7d",
    referenceName: "Vidas ilimitadas 7 dias",
    priceTier: "50",
    locales: {
      "pt-BR": { name: "Vidas ilimitadas — 7 dias", description: "Sete dias de vidas infinitas." },
      "en-US": { name: "Unlimited hearts — 7 days", description: "Seven days of infinite hearts." },
      "es-ES": { name: "Vidas ilimitadas — 7 días", description: "Siete días de vidas infinitas." },
    },
  },
  {
    productId: "br.com.capitaolori.app.streak_freeze_3",
    referenceName: "3 escudos de gelo",
    priceTier: "10",
    locales: {
      "pt-BR": { name: "3 escudos de gelo", description: "Protege sua ofensiva por 3 dias sem treino." },
      "en-US": { name: "3 streak freezes", description: "Protect your streak for 3 missed days." },
      "es-ES": { name: "3 escudos de hielo", description: "Protege tu racha por 3 días sin práctica." },
    },
  },
];

// --- JWT (ES256) ----------------------------------------------------------

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt() {
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 600, // 10min
    aud: "appstoreconnect-v1",
  };
  const encHeader = b64url(JSON.stringify(header));
  const encPayload = b64url(JSON.stringify(payload));
  const signer = createSign("SHA256");
  signer.update(`${encHeader}.${encPayload}`);
  signer.end();
  // ASC expects raw JOSE-style ES256 (R || S, 64 bytes), but Node returns
  // DER-encoded. Convert.
  const der = signer.sign({ key: KEY, dsaEncoding: "ieee-p1363" });
  return `${encHeader}.${encPayload}.${b64url(der)}`;
}

// --- HTTP ----------------------------------------------------------------

const BASE = "https://api.appstoreconnect.apple.com/v1";

async function apiFetch(path, init = {}) {
  if (DRY) {
    console.log(`[DRY] ${init.method ?? "GET"} ${path}`);
    if (init.body) console.log("       body:", init.body.slice(0, 200), "…");
    return { data: { id: "dry-id-" + path.replace(/\//g, "_") } };
  }
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers = {
    Authorization: `Bearer ${signJwt()}`,
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ASC ${init.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// --- Operations -----------------------------------------------------------

async function findApp() {
  const r = await apiFetch(
    `/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&limit=1`,
  );
  const app = r.data?.[0];
  if (!app) throw new Error(`App ${BUNDLE_ID} not found in App Store Connect.`);
  return app.id;
}

async function ensureSubscriptionGroup(appId) {
  const list = await apiFetch(
    `/apps/${appId}/subscriptionGroups?limit=50`,
  );
  const existing = (list.data ?? []).find(
    (g) => g.attributes?.referenceName === SUBSCRIPTION_GROUP_REF,
  );
  if (existing) return existing.id;
  const created = await apiFetch(`/subscriptionGroups`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "subscriptionGroups",
        attributes: { referenceName: SUBSCRIPTION_GROUP_REF },
        relationships: {
          app: { data: { type: "apps", id: appId } },
        },
      },
    }),
  });
  // Localize group display name.
  await apiFetch(`/subscriptionGroupLocalizations`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "subscriptionGroupLocalizations",
        attributes: { name: SUBSCRIPTION_GROUP_NAME, locale: "pt-BR" },
        relationships: {
          subscriptionGroup: { data: { type: "subscriptionGroups", id: created.data.id } },
        },
      },
    }),
  });
  return created.data.id;
}

async function ensureSubscription(groupId, def) {
  const list = await apiFetch(
    `/subscriptionGroups/${groupId}/subscriptions?limit=50`,
  );
  const existing = (list.data ?? []).find(
    (s) => s.attributes?.productId === def.productId,
  );
  let id = existing?.id;
  if (!id) {
    const created = await apiFetch(`/subscriptions`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "subscriptions",
          attributes: {
            productId: def.productId,
            referenceName: def.referenceName,
            subscriptionPeriod: def.subscriptionPeriod,
            familySharable: true,
          },
          relationships: {
            group: { data: { type: "subscriptionGroups", id: groupId } },
          },
        },
      }),
    });
    id = created.data.id;
    console.log(`✓ Created subscription ${def.productId} → ${id}`);
  } else {
    console.log(`= Exists subscription ${def.productId} → ${id}`);
  }
  await ensureSubLocalizations(id, def.locales);
  return id;
}

async function ensureSubLocalizations(subId, locales) {
  const existing = await apiFetch(
    `/subscriptions/${subId}/subscriptionLocalizations?limit=100`,
  );
  const have = new Set(
    (existing.data ?? []).map((d) => d.attributes?.locale),
  );
  for (const [locale, copy] of Object.entries(locales)) {
    if (have.has(locale)) continue;
    await apiFetch(`/subscriptionLocalizations`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "subscriptionLocalizations",
          attributes: { name: copy.name, description: copy.description, locale },
          relationships: {
            subscription: { data: { type: "subscriptions", id: subId } },
          },
        },
      }),
    });
    console.log(`  ✓ Localized ${subId} ${locale}`);
  }
}

async function ensureInAppPurchase(appId, def, kind) {
  // kind: "NON_CONSUMABLE" | "CONSUMABLE"
  const list = await apiFetch(
    `/apps/${appId}/inAppPurchasesV2?limit=200`,
  );
  const existing = (list.data ?? []).find(
    (p) => p.attributes?.productId === def.productId,
  );
  let id = existing?.id;
  if (!id) {
    const created = await apiFetch(`/inAppPurchases`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "inAppPurchases",
          attributes: {
            productId: def.productId,
            referenceName: def.referenceName,
            inAppPurchaseType: kind,
            familySharable: kind === "NON_CONSUMABLE",
          },
          relationships: {
            app: { data: { type: "apps", id: appId } },
          },
        },
      }),
    });
    id = created.data.id;
    console.log(`✓ Created IAP ${def.productId} → ${id}`);
  } else {
    console.log(`= Exists IAP ${def.productId} → ${id}`);
  }
  await ensureIapLocalizations(id, def.locales);
  return id;
}

async function ensureIapLocalizations(iapId, locales) {
  const existing = await apiFetch(
    `/inAppPurchases/${iapId}/inAppPurchaseLocalizations?limit=100`,
  );
  const have = new Set(
    (existing.data ?? []).map((d) => d.attributes?.locale),
  );
  for (const [locale, copy] of Object.entries(locales)) {
    if (have.has(locale)) continue;
    await apiFetch(`/inAppPurchaseLocalizations`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "inAppPurchaseLocalizations",
          attributes: { name: copy.name, description: copy.description, locale },
          relationships: {
            inAppPurchaseV2: { data: { type: "inAppPurchases", id: iapId } },
          },
        },
      }),
    });
    console.log(`  ✓ Localized ${iapId} ${locale}`);
  }
}

// --- Main ----------------------------------------------------------------

async function main() {
  console.log(DRY ? "Mode: DRY RUN (no API calls)" : `Target: ${BASE}`);
  const appId = await findApp();
  console.log(`App: ${BUNDLE_ID} → ${appId}`);

  const groupId = await ensureSubscriptionGroup(appId);
  console.log(`Subscription group: ${SUBSCRIPTION_GROUP_NAME} → ${groupId}`);

  for (const sub of SUBSCRIPTIONS) {
    await ensureSubscription(groupId, sub);
  }

  await ensureInAppPurchase(appId, NON_CONSUMABLE, "NON_CONSUMABLE");
  for (const c of CONSUMABLES) {
    await ensureInAppPurchase(appId, c, "CONSUMABLE");
  }

  console.log("\nDone. Next:");
  console.log(
    "  • App Store Connect → Apps → CMTE Lori → In-App Purchases → set Price Tier for each (this API doesn't expose price tier directly).",
  );
  console.log(
    "  • Add Introductory Offer (7-day free trial) to pro_monthly and pro_yearly manually.",
  );
  console.log("  • Submit IAPs together with the next build.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
