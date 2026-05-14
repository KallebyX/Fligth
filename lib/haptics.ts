"use client";

// Lightweight haptic helper. On Capacitor (iOS/Android) we use the native
// plugin; on the web we fall back to the Vibration API where available.
// Calls are silent no-ops on unsupported platforms so callers can sprinkle
// them freely without environment checks.

import { isNative } from "@/lib/platform";

type Style = "light" | "medium" | "heavy";
type Notify = "success" | "warning" | "error";

const ENABLED_KEY = "lori.haptics.enabled";

function enabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ENABLED_KEY) !== "false";
}

async function nativeHaptics() {
  if (!isNative()) return null;
  try {
    const mod = (await import("@capacitor/haptics")) as typeof import("@capacitor/haptics");
    return mod;
  } catch {
    return null;
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    vibrate?: (p: number | number[]) => boolean;
  };
  nav.vibrate?.(pattern);
}

export async function impact(style: Style = "light") {
  if (!enabled()) return;
  const native = await nativeHaptics();
  if (native?.Haptics) {
    const map = { light: "Light", medium: "Medium", heavy: "Heavy" } as const;
    await native.Haptics.impact({ style: native.ImpactStyle[map[style]] });
    return;
  }
  vibrate(style === "heavy" ? 30 : style === "medium" ? 20 : 10);
}

export async function notify(kind: Notify = "success") {
  if (!enabled()) return;
  const native = await nativeHaptics();
  if (native?.Haptics) {
    const map = { success: "Success", warning: "Warning", error: "Error" } as const;
    await native.Haptics.notification({ type: native.NotificationType[map[kind]] });
    return;
  }
  vibrate(kind === "success" ? [12, 60, 12] : kind === "warning" ? [25, 40, 25] : [40, 30, 40, 30, 40]);
}

export function setHapticsEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENABLED_KEY, on ? "true" : "false");
}
