"use client";

import { useCallback, useEffect, useRef } from "react";
import { playPatch, type PatchName } from "@/lib/sound/synth";
import { warmupAudio } from "@/lib/sound/mixer";

// SfxName is preserved (and now widened) so existing call sites keep working
// while new sites can use the aviation patches added in Phase 18.
export type SfxName = PatchName;

const LEGACY_KEY = "lori.sfx.enabled";

/**
 * Thin React shim around the singleton synth. The real audio plumbing lives
 * in lib/sound/{mixer,synth,patches}.ts; this hook just exposes a stable
 * imperative API to UI components.
 */
export function useSfx() {
  // Schedule audio context warmup on first user gesture per page. Avoids
  // the audible click when the first real SFX plays — iOS Safari needs
  // the context unlocked + at least one silent ramp before "real" notes.
  const warmedUp = useRef(false);
  useEffect(() => {
    if (warmedUp.current) return;
    function once() {
      if (warmedUp.current) return;
      warmedUp.current = true;
      warmupAudio();
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
    }
    window.addEventListener("pointerdown", once, { passive: true });
    window.addEventListener("keydown", once);
    return () => {
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
    };
  }, []);

  const play = useCallback((name: SfxName) => {
    playPatch(name);
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LEGACY_KEY, on ? "true" : "false");
  }, []);

  return { play, setEnabled };
}
