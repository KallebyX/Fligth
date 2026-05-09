"use client";

import { useCallback, useEffect, useRef } from "react";

export type SfxName = "correct" | "wrong" | "level-up" | "streak" | "lesson-complete";

const FILES: Record<SfxName, string> = {
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  "level-up": "/sounds/level-up.mp3",
  streak: "/sounds/streak.mp3",
  "lesson-complete": "/sounds/lesson-complete.mp3",
};

const STORAGE_KEY = "lori.sfx.enabled";

export function useSfx() {
  const cache = useRef<Map<SfxName, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const name of Object.keys(FILES) as SfxName[]) {
      if (!cache.current.has(name)) {
        const audio = new Audio(FILES[name]);
        audio.preload = "auto";
        cache.current.set(name, audio);
      }
    }
  }, []);

  const play = useCallback((name: SfxName) => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "false") return;
    const a = cache.current.get(name);
    if (!a) return;
    try {
      a.currentTime = 0;
      void a.play();
    } catch {
      /* user gesture required */
    }
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, on ? "true" : "false");
  }, []);

  return { play, setEnabled };
}
