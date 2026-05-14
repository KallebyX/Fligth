"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { useSfx } from "@/components/learn/useSfx";
import { notify } from "@/lib/haptics";
import { Award, Flame, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// react-confetti pulls in canvas + measures the window, so it's client-only.
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

function useWindowSize() {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

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
  const { w, h } = useWindowSize();
  const [animatedXp, setAnimatedXp] = useState(0);
  const [confettiRunning, setConfettiRunning] = useState(true);

  useEffect(() => {
    sfx.play("lesson-complete");
    void notify("success");
    const dur = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // ease-out cubic so the number lands instead of speeds.
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedXp(Math.round(xpAwarded * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const confettiTimer = window.setTimeout(() => setConfettiRunning(false), 3200);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(confettiTimer);
    };
  }, [xpAwarded, sfx]);

  return (
    <main className="container relative flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 py-10 text-center">
      {w > 0 && (
        <Confetti
          width={w}
          height={h}
          numberOfPieces={perfect ? 280 : 160}
          recycle={confettiRunning}
          gravity={0.22}
          colors={["#0EA5E9", "#10B981", "#F97316", "#FBBF24", "#A78BFA"]}
        />
      )}

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="relative"
      >
        <Mascot state="celebrate" size={160} />
        {perfect && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 240, damping: 10 }}
            className="absolute -right-2 -top-1 rounded-full bg-gold p-2 text-ink shadow-pop"
          >
            <Sparkles size={20} />
          </motion.div>
        )}
      </motion.div>

      <div>
        <h1 className="text-3xl font-black md:text-4xl">
          {perfect ? "Voo perfeito!" : "Lição concluída!"}
        </h1>
        {perfect && (
          <p className="mt-1 text-sm font-bold uppercase tracking-wider text-gold">
            Você acertou todas
          </p>
        )}
      </div>

      <div className="grid w-full gap-3">
        <Stat
          icon={<Sparkles size={18} />}
          label="XP ganho"
          value={`+${animatedXp}`}
          accent="bg-gold/20 text-gold"
        />
        <Stat
          icon={<Flame size={18} />}
          label="Ofensiva"
          value={`${newStreak} dia${newStreak === 1 ? "" : "s"}`}
          accent="bg-sun/20 text-sun"
        />
        <Stat
          icon={<Heart size={18} />}
          label="Vidas"
          value={`${hearts} / 5`}
          accent="bg-alert/20 text-alert"
        />
      </div>

      <div className="w-full pt-2 pb-[env(safe-area-inset-bottom)]">
        <Link href="/learn">
          <Button size="lg" className="w-full">
            <Award size={18} />
            Continuar voando
          </Button>
        </Link>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card-pop flex items-center justify-between gap-3 p-4"
    >
      <span className="flex items-center gap-3 text-sm font-bold text-ink/70">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", accent)}>
          {icon}
        </span>
        {label}
      </span>
      <span className="text-2xl font-black text-ink">{value}</span>
    </motion.div>
  );
}
