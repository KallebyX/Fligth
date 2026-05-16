// =============================================================================
// Aviation-themed synth patches — pure Web Audio, no MP3 assets.
// =============================================================================
//
// Every patch is a sequence of `Voice`s scheduled relative to the play() call.
// A Voice is an oscillator (or noise burst) with frequency, duration, envelope,
// and waveform. The synth engine (lib/sound/synth.ts) renders these through
// the mixer's `sfx` category.
//
// Aviation feel comes from:
//   • engine-start: long ramping square sweep + low-rate vibrato
//   • engine-ramp: rising sawtooth chord (RPM increasing)
//   • gear-horn: continuous square at 400 Hz (real GUMP horn frequency)
//   • stall-horn: piercing sine at 1500 Hz pulsed
//   • radio-squelch: short noise burst into a band-pass
//   • atc-chime: two-tone airline cabin chime (G then C)
//
// Volume scaling done inside each Voice — keep peak gain ≤ 0.15 to avoid
// clipping when the mixer master is at 1.0.

export type Waveform = "sine" | "square" | "sawtooth" | "triangle" | "noise";

export type Voice = {
  freq: number;          // Hz; ignored for noise
  dur: number;           // ms; total length of this voice
  delay?: number;        // ms; offset from patch start
  type?: Waveform;       // default "sine"
  gain?: number;         // peak gain 0–1, default 0.10
  attack?: number;       // ms ramp up, default 5
  release?: number;      // ms ramp down to ~0, default = dur/2
  detune?: number;       // cents
  vibrato?: { rate: number; depth: number }; // Hz, cents
  bandpass?: { center: number; q: number };  // for noise voices
};

export type PatchName =
  // legacy (preserved for backwards compat) -------------------------------
  | "tap"
  | "correct"
  | "wrong"
  | "level-up"
  | "streak"
  | "lesson-complete"
  // aviation -------------------------------------------------------------
  | "engine-start"
  | "engine-ramp"
  | "gear-up"
  | "gear-horn"
  | "stall-horn"
  | "radio-squelch"
  | "radio-clearance"
  | "atc-chime"
  | "cabin-chime";

export const PATCHES: Record<PatchName, Voice[]> = {
  // ---------- legacy patches (same as old useSfx) -------------------------
  tap: [
    { freq: 660, dur: 40, type: "square", gain: 0.04 },
  ],
  correct: [
    { freq: 523.25, dur: 80 },
    { freq: 659.25, dur: 80, delay: 80 },
    { freq: 783.99, dur: 140, delay: 160 },
  ],
  wrong: [
    { freq: 311.13, dur: 110, type: "sawtooth", gain: 0.08 },
    { freq: 246.94, dur: 180, type: "sawtooth", gain: 0.08, delay: 110 },
  ],
  "level-up": [
    { freq: 523.25, dur: 90 },
    { freq: 659.25, dur: 90, delay: 90 },
    { freq: 783.99, dur: 90, delay: 180 },
    { freq: 1046.5, dur: 220, delay: 270 },
  ],
  streak: [
    { freq: 880, dur: 90 },
    { freq: 880, dur: 90, delay: 90 },
  ],
  "lesson-complete": [
    { freq: 523.25, dur: 110 },
    { freq: 659.25, dur: 110, delay: 110 },
    { freq: 783.99, dur: 110, delay: 220 },
    { freq: 1046.5, dur: 320, delay: 330 },
  ],

  // ---------- aviation patches -------------------------------------------

  // Engine spin-up: prop coming alive. Ramps from low to mid square wave
  // with subtle vibrato to mimic a piston engine firing irregularly.
  "engine-start": [
    { freq: 80, dur: 700, type: "sawtooth", gain: 0.06, attack: 200, release: 250, vibrato: { rate: 6, depth: 30 } },
    { freq: 160, dur: 500, type: "sawtooth", gain: 0.05, delay: 350, attack: 50, release: 200, vibrato: { rate: 5, depth: 25 } },
  ],

  // Engine rev / RPM bump — used for streak day +1
  "engine-ramp": [
    { freq: 220, dur: 350, type: "sawtooth", gain: 0.06, attack: 30, release: 100, vibrato: { rate: 4, depth: 15 } },
    { freq: 330, dur: 350, type: "sawtooth", gain: 0.05, delay: 100, attack: 30, release: 120, vibrato: { rate: 4, depth: 15 } },
    { freq: 440, dur: 500, type: "sawtooth", gain: 0.05, delay: 200, attack: 30, release: 200, vibrato: { rate: 4, depth: 15 } },
  ],

  // Gear up — short rising whir. Used for level-up / unlock.
  "gear-up": [
    { freq: 200, dur: 200, type: "triangle", gain: 0.07, attack: 10, release: 100 },
    { freq: 400, dur: 200, type: "triangle", gain: 0.07, delay: 80, attack: 10, release: 100 },
    { freq: 600, dur: 250, type: "triangle", gain: 0.06, delay: 160, attack: 10, release: 150 },
  ],

  // Gear warning horn — continuous 400 Hz square (real GUMP horn).
  // Used when user loses a heart.
  "gear-horn": [
    { freq: 400, dur: 280, type: "square", gain: 0.08, attack: 5, release: 80 },
  ],

  // Stall warning horn — piercing 1500 Hz pulsed. Used when last heart lost.
  "stall-horn": [
    { freq: 1500, dur: 150, type: "square", gain: 0.10, attack: 5, release: 30 },
    { freq: 1500, dur: 150, type: "square", gain: 0.10, delay: 200, attack: 5, release: 30 },
    { freq: 1500, dur: 200, type: "square", gain: 0.10, delay: 400, attack: 5, release: 80 },
  ],

  // ATC radio squelch — brief noise burst through band-pass (mimics
  // "kerchunk" when transmission opens). Used on starting a lesson.
  "radio-squelch": [
    { freq: 0, dur: 60, type: "noise", gain: 0.08, attack: 5, release: 30, bandpass: { center: 1800, q: 4 } },
    { freq: 0, dur: 40, type: "noise", gain: 0.05, delay: 80, attack: 5, release: 20, bandpass: { center: 1200, q: 6 } },
  ],

  // ATC "Cleared for takeoff" feel — squelch + ascending chord. Used on
  // perfect lessons.
  "radio-clearance": [
    { freq: 0, dur: 60, type: "noise", gain: 0.06, attack: 5, release: 30, bandpass: { center: 1800, q: 4 } },
    { freq: 523.25, dur: 150, type: "sine", gain: 0.08, delay: 80, attack: 10, release: 100 },
    { freq: 659.25, dur: 150, type: "sine", gain: 0.08, delay: 180, attack: 10, release: 100 },
    { freq: 783.99, dur: 220, type: "sine", gain: 0.08, delay: 280, attack: 10, release: 150 },
  ],

  // Two-tone airline cabin chime (real Boeing chime is 1024 + 512 Hz).
  // Used for toast notifications.
  "atc-chime": [
    { freq: 1024, dur: 250, type: "sine", gain: 0.07, attack: 5, release: 200 },
    { freq: 512, dur: 350, type: "sine", gain: 0.07, delay: 200, attack: 5, release: 280 },
  ],

  // Fasten-seatbelt ding — single bright tone. Used for generic alerts.
  "cabin-chime": [
    { freq: 880, dur: 300, type: "sine", gain: 0.06, attack: 5, release: 250 },
  ],
};
