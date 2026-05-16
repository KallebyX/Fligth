"use client";

// =============================================================================
// SoundMixer — categorized audio routing with persistent per-category volumes.
// =============================================================================
//
// Categories:
//   sfx     — short UI / gameplay sounds (tap, correct, wrong, streak…)
//   ambient — looping background (cockpit hum) — optional, off by default
//   music   — optional lo-fi cruise track — off by default
//   voice   — TTS (currently external, but we expose ducking hooks for it)
//
// Each category has an independent volume (0–1) and mute flag. The MASTER
// volume multiplies through everything. Sources route through a per-category
// GainNode → master GainNode → destination, so we can duck a category in real
// time (e.g. fade `music` to 30% while TTS speaks).
//
// State is persisted to localStorage under `lori.mixer.v1` as a single JSON
// blob — survives reloads, doesn't need a server round-trip.

export type MixerCategory = "sfx" | "ambient" | "music" | "voice";

export type MixerState = {
  master: { vol: number; muted: boolean };
  sfx: { vol: number; muted: boolean };
  ambient: { vol: number; muted: boolean; enabled: boolean };
  music: { vol: number; muted: boolean; enabled: boolean };
  voice: { vol: number; muted: boolean };
};

const STORAGE_KEY = "lori.mixer.v1";

const DEFAULT_STATE: MixerState = {
  master: { vol: 1.0, muted: false },
  sfx: { vol: 0.8, muted: false },
  ambient: { vol: 0.3, muted: false, enabled: false },
  music: { vol: 0.4, muted: false, enabled: false },
  voice: { vol: 1.0, muted: false },
};

class SoundMixer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private categoryGains: Record<MixerCategory, GainNode | null> = {
    sfx: null,
    ambient: null,
    music: null,
    voice: null,
  };
  private state: MixerState = DEFAULT_STATE;
  private listeners = new Set<() => void>();
  private duckTimers: Partial<Record<MixerCategory, ReturnType<typeof setTimeout>>> = {};

  init() {
    if (typeof window === "undefined") return;
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MixerState>;
        this.state = { ...DEFAULT_STATE, ...parsed };
      }
    } catch {
      // ignore bad JSON, use defaults
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // quota or private mode — silently swallow
    }
  }

  getState(): MixerState {
    return this.state;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  setVolume(cat: MixerCategory | "master", vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.state = { ...this.state, [cat]: { ...this.state[cat], vol: clamped } };
    this.save();
    this.applyGains();
    this.notify();
  }

  setMuted(cat: MixerCategory | "master", muted: boolean) {
    this.state = { ...this.state, [cat]: { ...this.state[cat], muted } };
    this.save();
    this.applyGains();
    this.notify();
  }

  setEnabled(cat: "ambient" | "music", enabled: boolean) {
    this.state = { ...this.state, [cat]: { ...this.state[cat], enabled } };
    this.save();
    this.applyGains();
    this.notify();
  }

  /**
   * Duck a category for `durationMs` to `targetVol` (relative, 0–1). Useful
   * for music/ambient while TTS speaks. Restores previous gain after.
   */
  duck(cat: MixerCategory, targetVol: number, durationMs: number) {
    const ctx = this.getCtx();
    const gain = this.categoryGains[cat];
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    const cur = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    gain.gain.linearRampToValueAtTime(cur * targetVol, now + 0.15);
    if (this.duckTimers[cat]) clearTimeout(this.duckTimers[cat]);
    this.duckTimers[cat] = setTimeout(() => {
      const c = this.getCtx();
      const g = this.categoryGains[cat];
      if (!c || !g) return;
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.linearRampToValueAtTime(this.effectiveGain(cat), t + 0.3);
    }, durationMs);
  }

  /**
   * Returns the AudioContext, creating it lazily on first user gesture.
   * Browsers suspend the context until interaction; callers should ensure
   * the first call happens inside a tap/click handler.
   */
  getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      this.buildGraph();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private buildGraph() {
    if (!this.ctx) return;
    const dest = this.ctx.destination;
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(dest);
    for (const cat of ["sfx", "ambient", "music", "voice"] as MixerCategory[]) {
      const g = this.ctx.createGain();
      g.connect(this.masterGain);
      this.categoryGains[cat] = g;
    }
    this.applyGains();
  }

  /** Public: route a source through the given category. Returns the input node. */
  destinationFor(cat: MixerCategory): AudioNode | null {
    this.getCtx(); // ensures graph
    return this.categoryGains[cat];
  }

  private effectiveGain(cat: MixerCategory): number {
    const s = this.state[cat];
    if (s.muted) return 0;
    if ((cat === "ambient" || cat === "music") && !this.state[cat].enabled) return 0;
    return s.vol;
  }

  private applyGains() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const master = this.state.master.muted ? 0 : this.state.master.vol;
    this.masterGain.gain.setTargetAtTime(master, t, 0.05);
    for (const cat of ["sfx", "ambient", "music", "voice"] as MixerCategory[]) {
      const g = this.categoryGains[cat];
      if (g) g.gain.setTargetAtTime(this.effectiveGain(cat), t, 0.05);
    }
  }
}

// Singleton — there's at most one mixer per tab.
let _mixer: SoundMixer | null = null;

export function getMixer(): SoundMixer {
  if (!_mixer) {
    _mixer = new SoundMixer();
    if (typeof window !== "undefined") _mixer.init();
  }
  return _mixer;
}
