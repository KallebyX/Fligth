// Single source of truth for "is the user Pro?". Used both server-side
// (page guards, server actions) and to render gated UI.

export type ProStatus = {
  isPro: boolean;
  plan: "monthly" | "yearly" | "lifetime" | "trial" | null;
  expiresAt: string | null; // ISO; null when lifetime
};

export function computeProStatus(
  proUntil: string | null,
  proPlan: string | null,
  now: Date = new Date(),
): ProStatus {
  if (proPlan === "lifetime") {
    return { isPro: true, plan: "lifetime", expiresAt: null };
  }
  if (!proUntil) {
    return { isPro: false, plan: null, expiresAt: null };
  }
  const end = new Date(proUntil);
  if (end.getTime() > now.getTime()) {
    return {
      isPro: true,
      plan: (proPlan as ProStatus["plan"]) ?? "monthly",
      expiresAt: end.toISOString(),
    };
  }
  return { isPro: false, plan: null, expiresAt: end.toISOString() };
}
