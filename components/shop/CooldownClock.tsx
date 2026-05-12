"use client";

import { useEffect, useState } from "react";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function CooldownClock({
  nextAt,
  onReady,
}: {
  nextAt: string | null;
  onReady?: () => void;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!nextAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [nextAt]);

  if (!nextAt) return null;
  const diff = new Date(nextAt).getTime() - now;
  if (diff <= 0) {
    onReady?.();
    return <span className="font-extrabold text-grass">Disponível agora</span>;
  }
  return <span className="font-extrabold tabular-nums">{format(diff)}</span>;
}
