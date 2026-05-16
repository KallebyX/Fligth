"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Volume2,
  VolumeX,
  Headphones,
  Radio,
  Music2,
  Mic2,
  Play,
} from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMixer, type MixerCategory } from "@/lib/sound/mixer";
import { playPatch, startAmbient, stopAmbient } from "@/lib/sound/synth";
import { cn } from "@/lib/utils";

const ROWS: Array<{
  cat: MixerCategory | "master";
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  testSound?: Parameters<typeof playPatch>[0];
  enableToggle?: "ambient" | "music";
}> = [
  {
    cat: "master",
    label: "Volume geral",
    description: "Controla tudo de uma vez.",
    icon: Volume2,
  },
  {
    cat: "sfx",
    label: "Efeitos sonoros",
    description: "Acertos, erros, ofensiva, simulado.",
    icon: Headphones,
    testSound: "correct",
  },
  {
    cat: "voice",
    label: "Narração",
    description: "Leitura em voz alta de teorias e perguntas.",
    icon: Mic2,
  },
  {
    cat: "ambient",
    label: "Som ambiente de cockpit",
    description: "Zumbido baixo de motor enquanto estuda. Off por padrão.",
    icon: Radio,
    enableToggle: "ambient",
  },
  {
    cat: "music",
    label: "Música de fundo",
    description: "Lo-fi cruise. Off por padrão.",
    icon: Music2,
    enableToggle: "music",
  },
];

function subscribe(cb: () => void) {
  return getMixer().subscribe(cb);
}

function getSnapshot() {
  return JSON.stringify(getMixer().getState());
}

export function SoundMixerSection() {
  // useSyncExternalStore keeps every slider in sync if mixer state changes
  // from elsewhere (e.g. dock duck during TTS).
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const mixer = getMixer();
  const state = mixer.getState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (state.ambient.enabled && !state.ambient.muted && state.master.vol > 0) {
      startAmbient();
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [ready, state.ambient.enabled, state.ambient.muted, state.master.vol]);

  if (!ready) {
    return (
      <Card>
        <CardTitle>Mixer de áudio</CardTitle>
        <CardDesc>Carregando…</CardDesc>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Mixer de áudio</CardTitle>
      <CardDesc>
        Sons sintetizados em tempo real (sem download de assets). Suas
        preferências ficam salvas neste navegador.
      </CardDesc>

      <div className="mt-4 space-y-3">
        {ROWS.map((row) => {
          const s = state[row.cat];
          const Icon = row.icon;
          const muted = s.muted;
          const vol = s.vol;
          const enableToggle = row.enableToggle;
          const enabled = enableToggle
            ? (state[enableToggle] as { enabled: boolean }).enabled
            : true;
          return (
            <div
              key={row.cat}
              className={cn(
                "rounded-2xl border-2 bg-cloud/60 p-3",
                muted ? "border-cloud-deep/50 opacity-70" : "border-cloud-deep",
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label={muted ? "Reativar" : "Silenciar"}
                  onClick={() => mixer.setMuted(row.cat, !muted)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-cloud-deep/40",
                    muted ? "bg-cloud text-ink/40" : "bg-white text-ink/70",
                  )}
                >
                  {muted ? <VolumeX size={18} /> : <Icon size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-ink">{row.label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-ink/65">
                    {row.description}
                  </p>
                  {enableToggle && (
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-ink/70">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          mixer.setEnabled(enableToggle, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-cloud-deep accent-sky"
                      />
                      {enabled ? "Ativado" : "Desativado"}
                    </label>
                  )}
                </div>
                {row.testSound && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => playPatch(row.testSound!)}
                    aria-label="Testar som"
                  >
                    <Play size={14} />
                  </Button>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={vol}
                  onChange={(e) =>
                    mixer.setVolume(row.cat, Number(e.target.value))
                  }
                  disabled={muted}
                  className="flex-1 accent-sky"
                  aria-label={`${row.label} volume`}
                />
                <span className="w-10 shrink-0 text-right font-mono text-xs text-ink/60">
                  {Math.round(vol * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
