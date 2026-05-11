// Centraliza a detecção do shell nativo (iOS/Android via Capacitor) versus web.
// Importante para roteamento de pagamentos: lojas exigem IAP nativo para bens
// digitais consumíveis dentro do app, e proíbem Stripe/web para isso.

export type Platform = "web" | "ios" | "android";

export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  const w = window as unknown as {
    Capacitor?: { getPlatform?: () => Platform; isNativePlatform?: () => boolean };
  };
  if (w.Capacitor?.isNativePlatform?.()) {
    const p = w.Capacitor.getPlatform?.();
    if (p === "ios" || p === "android") return p;
  }
  return "web";
}

// When true, hide Stripe checkout and show the in-app purchase placeholder.
// Flip this on once StoreKit (iOS) and Play Billing (Android) plugins ship.
export const NATIVE_IAP_ENABLED = false;
