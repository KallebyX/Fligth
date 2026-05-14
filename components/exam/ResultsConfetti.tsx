"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

export function ResultsConfetti() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    const stop = window.setTimeout(() => setRunning(false), 5000);
    return () => {
      window.removeEventListener("resize", update);
      window.clearTimeout(stop);
    };
  }, []);

  if (size.w === 0) return null;
  return (
    <Confetti
      width={size.w}
      height={size.h}
      numberOfPieces={running ? 320 : 0}
      recycle={running}
      gravity={0.2}
      colors={["#0EA5E9", "#10B981", "#F97316", "#FBBF24", "#A78BFA", "#67E8F9"]}
    />
  );
}
