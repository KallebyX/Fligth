"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the user has prefers-reduced-motion: reduce set.
 * Use this to skip non-essential animations: mascot blink/flap, confetti,
 * shake on wrong-answer, motion.scale celebrations, etc.
 *
 * The first render returns `false` (motion enabled) so SSR matches the
 * default UX; the value updates after mount once we can read the media
 * query. Anyone toggling the OS setting mid-session is picked up via the
 * `change` listener.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
}
