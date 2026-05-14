"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/learn/useSfx";
import { impact, setHapticsEnabled } from "@/lib/haptics";

const SFX_KEY = "lori.sfx.enabled";
const HAPTICS_KEY = "lori.haptics.enabled";

function readBool(key: string, fallback = true) {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  if (v === null) return fallback;
  return v !== "false";
}

export function SoundHapticToggles() {
  const sfx = useSfx();
  const [sfxOn, setSfxOn] = useState(true);
  const [hapticsOn, setHapticsOnState] = useState(true);

  useEffect(() => {
    setSfxOn(readBool(SFX_KEY));
    setHapticsOnState(readBool(HAPTICS_KEY));
  }, []);

  function toggleSfx() {
    const next = !sfxOn;
    setSfxOn(next);
    sfx.setEnabled(next);
    if (next) sfx.play("tap");
  }

  function toggleHaptics() {
    const next = !hapticsOn;
    setHapticsOnState(next);
    setHapticsEnabled(next);
    if (next) void impact("medium");
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ToggleRow
        label="Sons"
        on={sfxOn}
        onToggle={toggleSfx}
        iconOn={<Volume2 size={20} />}
        iconOff={<VolumeX size={20} />}
      />
      <ToggleRow
        label="Vibração"
        on={hapticsOn}
        onToggle={toggleHaptics}
        iconOn={<Smartphone size={20} />}
        iconOff={<Smartphone size={20} className="opacity-40" />}
      />
    </div>
  );
}

function ToggleRow({
  label,
  on,
  onToggle,
  iconOn,
  iconOff,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border-2 p-3 text-left transition-colors",
        on ? "border-grass bg-grass/10" : "border-cloud-deep bg-white",
      )}
    >
      <span className="flex items-center gap-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", on ? "bg-grass text-white" : "bg-cloud text-ink/70")}>
          {on ? iconOn : iconOff}
        </span>
        <span className="font-extrabold">{label}</span>
      </span>
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors",
          on ? "bg-grass" : "bg-cloud-deep",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
