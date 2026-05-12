"use client";

import { useCallback, useEffect, useRef } from "react";

export type SfxName =
  | "tap"
  | "correct"
  | "wrong"
  | "level-up"
  | "streak"
  | "lesson-complete";

const STORAGE_KEY = "lori.sfx.enabled";

// Frequency in Hz, duration in ms.
type Note = { freq: number; dur: number; type?: OscillatorType; gain?: number };

// Designed sequences — short, snappy, mobile-friendly.
const PATCHES: Record<SfxName, Note[]> = {
  tap: [{ freq: 660, dur: 40, type: "square", gain: 0.04 }],
  correct: [
    { freq: 523.25, dur: 80 }, // C5
    { freq: 659.25, dur: 80 }, // E5
    { freq: 783.99, dur: 140 }, // G5
  ],
  wrong: [
    { freq: 311.13, dur: 110, type: "sawtooth", gain: 0.08 }, // Eb4
    { freq: 246.94, dur: 180, type: "sawtooth", gain: 0.08 }, // B3
  ],
  "level-up": [
    { freq: 523.25, dur: 90 },
    { freq: 659.25, dur: 90 },
    { freq: 783.99, dur: 90 },
    { freq: 1046.5, dur: 220 }, // C6
  ],
  streak: [
    { freq: 880, dur: 90 },
    { freq: 880, dur: 90 },
  ],
  "lesson-complete": [
    { freq: 523.25, dur: 110 }, // C5
    { freq: 659.25, dur: 110 }, // E5
    { freq: 783.99, dur: 110 }, // G5
    { freq: 1046.5, dur: 320 }, // C6 (sustain)
  ],
};

export function useSfx() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    };
  }, []);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) ctxRef.current = new AC();
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(STORAGE_KEY) === "false") return;
      const ctx = getCtx();
      if (!ctx) return;
      // Browsers suspend audio context until user gesture; resume is cheap.
      if (ctx.state === "suspended") void ctx.resume();

      const now = ctx.currentTime;
      let cursor = now;
      for (const note of PATCHES[name]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type ?? "sine";
        osc.frequency.value = note.freq;
        const peak = note.gain ?? 0.12;
        gain.gain.setValueAtTime(0, cursor);
        gain.gain.linearRampToValueAtTime(peak, cursor + 0.005);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          cursor + note.dur / 1000,
        );
        osc.connect(gain).connect(ctx.destination);
        osc.start(cursor);
        osc.stop(cursor + note.dur / 1000 + 0.02);
        cursor += note.dur / 1000;
      }
    },
    [getCtx],
  );

  const setEnabled = useCallback((on: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, on ? "true" : "false");
  }, []);

  return { play, setEnabled };
}
