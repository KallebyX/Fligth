// Detects whether the web app is running inside the Capacitor native shell
// (iOS / Android). The Capacitor runtime injects a global `window.Capacitor`
// with `isNativePlatform()` and `getPlatform()`. We avoid importing
// @capacitor/core here to keep the helper SSR-safe — the bundle that pulls
// the real plugins only loads on the client.

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.();
  if (p === "ios" || p === "android") return p;
  return "web";
}
