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

export function isNative(): boolean {
  const p = detectPlatform();
  return p === "ios" || p === "android";
}

// Feature flag: ative em produção depois de subir builds com IAP configurado
// em App Store Connect e Google Play. Em dev/sandbox, mantenha false para
// não bloquear a loja web durante testes.
export const NATIVE_IAP_ENABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_NATIVE_IAP_ENABLED === "true";
