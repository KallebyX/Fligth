"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const STORAGE_KEY = "lori.hud.last_xp";

export function XPBar({ xp }: { xp: number }) {
  const [shown, setShown] = useState<number>(xp);
  const animatingRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const prev = raw != null ? Number(raw) : null;

    // First load or stale data — just show current value.
    if (prev === null || !Number.isFinite(prev) || prev >= xp) {
      setShown(xp);
      window.localStorage.setItem(STORAGE_KEY, String(xp));
      return;
    }

    // Animate prev → xp.
    const start = prev;
    const end = xp;
    const dur = Math.min(1200, 400 + (end - start) * 4);
    const t0 = performance.now();
    if (animatingRef.current) cancelAnimationFrame(animatingRef.current);
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(start + (end - start) * eased);
      setShown(value);
      if (p < 1) {
        animatingRef.current = requestAnimationFrame(tick);
      } else {
        animatingRef.current = null;
        window.localStorage.setItem(STORAGE_KEY, String(end));
      }
    };
    animatingRef.current = requestAnimationFrame(tick);

    return () => {
      if (animatingRef.current) cancelAnimationFrame(animatingRef.current);
    };
  }, [xp]);

  const label = shown.toLocaleString("pt-BR");
  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1"
      aria-label={`${label} XP`}
    >
      <Star size={16} className="fill-gold text-gold" />
      <span className="text-sm font-extrabold tabular-nums text-ink">
        {label}
        <span className="ml-1 hidden text-ink/55 sm:inline">XP</span>
      </span>
    </div>
  );
}
