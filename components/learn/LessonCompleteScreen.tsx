"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { useSfx } from "@/components/learn/useSfx";

export function LessonCompleteScreen({
  xpAwarded,
  perfect,
  newStreak,
  hearts,
}: {
  xpAwarded: number;
  perfect: boolean;
  newStreak: number;
  hearts: number;
}) {
  const sfx = useSfx();
  const [animatedXp, setAnimatedXp] = useState(0);

  useEffect(() => {
    sfx.play("lesson-complete");
    const dur = 700;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setAnimatedXp(Math.round(xpAwarded * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [xpAwarded, sfx]);

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <Mascot state="celebrate" size={160} />
      </motion.div>

      <h1 className="text-3xl font-black md:text-5xl">
        {perfect ? "Voo perfeito!" : "Lição concluída!"}
      </h1>

      <div className="grid w-full max-w-md gap-3">
        <Stat label="XP ganho" value={`+${animatedXp}`} color="text-gold" />
        <Stat label="Ofensiva" value={`${newStreak} dia${newStreak === 1 ? "" : "s"}`} color="text-sun" />
        <Stat label="Vidas" value={`${hearts} / 5`} color="text-alert" />
      </div>

      <div className="flex w-full max-w-md flex-col gap-3 pt-4">
        <Link href="/learn">
          <Button size="lg" className="w-full">
            Continuar voando
          </Button>
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card-pop flex items-center justify-between p-4">
      <span className="text-sm font-bold text-ink/60">{label}</span>
      <span className={`text-2xl font-black ${color}`}>{value}</span>
    </div>
  );
}
