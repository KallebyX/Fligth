"use client";

import { useEffect, useState } from "react";
import { Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motion";

const STORAGE_KEY = "lori.hud.last_daily_xp";

// Pequeno ring no HUD mostrando "x / goal" XP de hoje. Quando alcança o
// goal, vira ícone de troféu dourado + label "🎯". Anima o preenchimento
// quando o valor muda (terminou uma lição).
export function DailyGoalRing({
  todayXp,
  goalXp,
}: {
  todayXp: number;
  goalXp: number;
}) {
  const [shown, setShown] = useState(todayXp);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const prev = raw != null ? Number(raw) : null;

    if (reducedMotion || prev === null || !Number.isFinite(prev) || prev >= todayXp) {
      setShown(todayXp);
      window.localStorage.setItem(STORAGE_KEY, String(todayXp));
      return;
    }

    // Animate prev → todayXp.
    let raf = 0;
    const start = prev;
    const end = todayXp;
    const dur = Math.min(900, 350 + (end - start) * 4);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(start + (end - start) * eased);
      setShown(value);
      if (p < 1) raf = requestAnimationFrame(tick);
      else window.localStorage.setItem(STORAGE_KEY, String(end));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [todayXp, reducedMotion]);

  const safeGoal = Math.max(1, goalXp);
  const pct = Math.min(100, Math.round((shown / safeGoal) * 100));
  const done = shown >= safeGoal;

  // SVG ring geometry — 14px radius, 16px stroke-circle, 16x16 viewBox.
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors",
        done ? "bg-gold/20" : "bg-sky/15",
      )}
      aria-label={
        done
          ? `Meta diária batida — ${shown} XP de ${goalXp}`
          : `Meta diária — ${shown} de ${goalXp} XP`
      }
      title={done ? "Meta diária batida! Faz mais uma?" : `${pct}% da meta diária`}
    >
      <div className="relative h-5 w-5 shrink-0">
        <svg viewBox="0 0 16 16" className="h-5 w-5 -rotate-90">
          <circle
            cx="8"
            cy="8"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={done ? "text-gold/30" : "text-sky/30"}
          />
          <circle
            cx="8"
            cy="8"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              "transition-[stroke-dashoffset]",
              reducedMotion ? "duration-0" : "duration-700",
              done ? "text-gold" : "text-sky",
            )}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {done ? (
            <Trophy size={10} className="text-gold" fill="currentColor" />
          ) : (
            <Target size={10} className="text-sky" />
          )}
        </div>
      </div>
      <span
        className={cn(
          "text-xs font-extrabold tabular-nums",
          done ? "text-gold" : "text-sky-deep",
        )}
      >
        {shown}
        <span className="text-ink/45">/{goalXp}</span>
      </span>
    </div>
  );
}
