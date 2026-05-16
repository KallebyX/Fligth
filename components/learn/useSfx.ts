"use client";

import { useCallback } from "react";
import { playPatch, type PatchName } from "@/lib/sound/synth";

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
  const play = useCallback((name: SfxName) => {
    playPatch(name);
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LEGACY_KEY, on ? "true" : "false");
  }, []);

  return { play, setEnabled };
}
