"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function MockExamTimer({
  startedAt,
  durationMs,
  onExpire,
}: {
  startedAt: number;
  durationMs: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, startedAt + durationMs - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, startedAt + durationMs - Date.now());
      setRemaining(r);
      if (r === 0) {
        clearInterval(id);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMs, onExpire]);

  const totalS = Math.round(remaining / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  const danger = remaining < 5 * 60_000; // last 5 min

  return (
    <div
      className={cn(
        "rounded-full px-3 py-1 font-mono text-sm font-bold",
        danger ? "bg-alert text-white" : "bg-cloud text-ink",
      )}
      role="timer"
      aria-live="polite"
    >
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}
