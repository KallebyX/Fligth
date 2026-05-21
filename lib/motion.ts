"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when motion should be reduced.
 *
 * Resolution order:
 *   1. App override (Configurações → Acessibilidade → Reduzir movimento)
 *      stored in localStorage under `lori.a11y.motion`:
 *        - "reduce"  → always reduce, regardless of OS
 *        - "allow"   → always allow, regardless of OS
 *        - "system"  → follow OS preference (default)
 *   2. OS preference: `prefers-reduced-motion: reduce`.
 *
 * SSR returns `false` (motion enabled); the real value lands after
 * mount. Live OS-pref changes are tracked via `change` listener.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function resolve(): boolean {
      const override = window.localStorage.getItem("lori.a11y.motion");
      if (override === "reduce") return true;
      if (override === "allow") return false;
      if (!window.matchMedia) return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    setReduced(resolve());

    // OS preference change.
    let mq: MediaQueryList | null = null;
    const onMqChange = () => setReduced(resolve());
    if (window.matchMedia) {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.addEventListener) mq.addEventListener("change", onMqChange);
      else mq.addListener(onMqChange);
    }

    // App override change (when the settings page toggles it).
    const onStorage = (e: StorageEvent) => {
      if (e.key === "lori.a11y.motion") setReduced(resolve());
    };
    window.addEventListener("storage", onStorage);

    // Same-tab updates: A11yProvider dispatches a custom event.
    const onCustom = () => setReduced(resolve());
    window.addEventListener("lori-a11y-change", onCustom);

    return () => {
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener("change", onMqChange);
        else mq.removeListener(onMqChange);
      }
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lori-a11y-change", onCustom);
    };
  }, []);

  return reduced;
}
