"use client";

import { getMixer } from "@/lib/sound/mixer";
import { PATCHES, type PatchName, type Voice } from "@/lib/sound/patches";

// Re-export so call sites can import everything from one place.
export type { PatchName } from "@/lib/sound/patches";

const LEGACY_KEY = "lori.sfx.enabled";

function sfxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  // Honor the legacy flag set by SoundHapticToggles + the new mixer state.
  if (window.localStorage.getItem(LEGACY_KEY) === "false") return false;
  const state = getMixer().getState();
  if (state.master.muted) return false;
  if (state.sfx.muted) return false;
  if (state.master.vol <= 0 || state.sfx.vol <= 0) return false;
  return true;
}

function renderVoice(ctx: AudioContext, dest: AudioNode, voice: Voice, startAt: number) {
  const peak = voice.gain ?? 0.10;
  const attack = (voice.attack ?? 5) / 1000;
  const dur = voice.dur / 1000;
  const release = (voice.release ?? voice.dur / 2) / 1000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + attack);
  gain.gain.setValueAtTime(peak, startAt + Math.max(attack, dur - release));
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur + 0.02);
  gain.connect(dest);

  if (voice.type === "noise") {
    // Pink-ish noise burst via a 0.5s buffer; band-pass filter optional.
    const bufferLen = Math.max(0.05, dur);
    const buf = ctx.createBuffer(1, ctx.sampleRate * bufferLen, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < ch.length; i++) {
      const white = Math.random() * 2 - 1;
      // simple 1-pole low-pass for warmer noise
      last = 0.85 * last + 0.15 * white;
      ch[i] = last * 0.7;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (voice.bandpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = voice.bandpass.center;
      filter.Q.value = voice.bandpass.q;
      src.connect(filter).connect(gain);
    } else {
      src.connect(gain);
    }
    src.start(startAt);
    src.stop(startAt + dur + 0.02);
    return;
  }

  const osc = ctx.createOscillator();
  osc.type = (voice.type ?? "sine") as OscillatorType;
  osc.frequency.value = voice.freq;
  if (voice.detune) osc.detune.value = voice.detune;
  osc.connect(gain);

  if (voice.vibrato) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = voice.vibrato.rate;
    lfoGain.gain.value = voice.vibrato.depth; // cents
    lfo.connect(lfoGain).connect(osc.detune);
    lfo.start(startAt);
    lfo.stop(startAt + dur + 0.05);
  }

  osc.start(startAt);
  osc.stop(startAt + dur + 0.05);
}

export function playPatch(name: PatchName) {
  if (typeof window === "undefined") return;
  if (!sfxEnabled()) return;
  const mixer = getMixer();
  const ctx = mixer.getCtx();
  if (!ctx) return;
  const dest = mixer.destinationFor("sfx");
  if (!dest) return;
  const patch = PATCHES[name];
  if (!patch) return;
  const start = ctx.currentTime + 0.005;
  for (const voice of patch) {
    renderVoice(ctx, dest, voice, start + (voice.delay ?? 0) / 1000);
  }
}

/**
 * Start an ambient looping pad (cockpit hum). Returns a stop function.
 * Idempotent — calling twice returns the same handle to a single source.
 */
let _ambientStop: (() => void) | null = null;
export function startAmbient(): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (_ambientStop) return _ambientStop;
  const mixer = getMixer();
  const state = mixer.getState();
  if (!state.ambient.enabled) return () => undefined;
  const ctx = mixer.getCtx();
  if (!ctx) return () => undefined;
  const dest = mixer.destinationFor("ambient");
  if (!dest) return () => undefined;

  // 3-second pink noise loop band-passed for cockpit-rumble feel.
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.0990460;
    b1 = 0.96300 * b1 + white * 0.2965164;
    b2 = 0.57000 * b2 + white * 1.0526913;
    ch[i] = (b0 + b1 + b2 + white * 0.1848) * 0.15;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 200;
  bp.Q.value = 0.7;

  src.connect(bp).connect(dest);
  src.start(ctx.currentTime + 0.05);

  _ambientStop = () => {
    try {
      src.stop();
    } catch {
      // already stopped
    }
    _ambientStop = null;
  };
  return _ambientStop;
}

export function stopAmbient() {
  if (_ambientStop) _ambientStop();
}
