"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Returns the next Monday 03:00 UTC after `now`.
function nextResetUtc(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCSeconds(0, 0);
  // Day 1 = Monday in JS Date.UTC; getUTCDay returns 0=Sun..6=Sat.
  const day = d.getUTCDay();
  const daysUntilMon = (8 - day) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilMon);
  d.setUTCHours(3, 0, 0, 0);
  // If we already crossed Monday 03:00 today, point at next week.
  if (d.getTime() <= now.getTime()) {
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return d;
}

function format(diffMs: number): string {
  if (diffMs <= 0) return "Reset agora";
  const totalSec = Math.floor(diffMs / 1000);
  const d = Math.floor(totalSec / 86_400);
  const h = Math.floor((totalSec % 86_400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

export function ResetTimer() {
  const [label, setLabel] = useState<string>("…");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setLabel(format(nextResetUtc(now).getTime() - now.getTime()));
    }
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
      <Clock size={12} />
      {label}
    </span>
  );
}
