"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Check, Star, Cloud, Compass, Wind, Wrench, RadioTower } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motion";

export type LessonNode = {
  id: number;
  slug: string;
  title: string;
  unitTitle: string;
  state: "locked" | "available" | "done";
};

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  tower: RadioTower,
  cloud: Cloud,
  compass: Compass,
  wing: Wind,
  engine: Wrench,
};

export function LessonPath({
  subjectSlug,
  subjectName,
  subjectColor,
  subjectIcon,
  nodes,
}: {
  subjectSlug: string;
  subjectName: string;
  subjectColor: string;
  subjectIcon?: string;
  nodes: LessonNode[];
}) {
  const Icon = SUBJECT_ICONS[subjectIcon ?? ""] ?? Star;
  const completedCount = nodes.filter((n) => n.state === "done").length;
  const progressPct = nodes.length ? Math.round((completedCount / nodes.length) * 100) : 0;
  const reducedMotion = useReducedMotion();

  return (
    <section className="mx-auto w-full max-w-md py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4 }}
        className="sticky top-16 z-10 mb-8 rounded-2xl px-5 py-4 text-white shadow-pop"
        style={{ backgroundColor: subjectColor }}
      >
        <div className="flex items-center gap-3">
          <Icon size={28} className="opacity-90" />
          <div className="flex-1">
            <span className="block text-[11px] uppercase tracking-wider opacity-80">Trilha</span>
            <h2 className="text-xl font-extrabold leading-tight">{subjectName}</h2>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                whileInView={{ width: `${progressPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="mt-1 block text-xs opacity-80">
              {completedCount}/{nodes.length} lições
            </span>
          </div>
        </div>
      </motion.div>

      <ol className="relative flex flex-col items-center gap-10 overflow-x-hidden">
        {nodes.map((n, i) => {
          // Offsets stay tight enough that the 80×80 node never crosses
          // the 320 px viewport edge (max horizontal travel = 56 px).
          const offset = i % 4 === 0 ? 0 : i % 4 === 1 ? 40 : i % 4 === 2 ? 56 : 40;
          const dir = Math.floor(i / 4) % 2 === 0 ? 1 : -1;

          return (
            <motion.li
              key={n.id}
              className="relative"
              style={{ transform: `translateX(${dir * offset}px)` }}
              initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.85 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: i * 0.07, type: "spring", stiffness: 200 }
              }
            >
              <p className="absolute -top-5 left-1/2 max-w-[180px] -translate-x-1/2 truncate text-[10px] font-bold uppercase tracking-wider text-ink/50">
                {n.unitTitle}
              </p>

              {n.state === "locked" ? (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-cloud-deep bg-cloud opacity-60"
                  aria-label={`${n.title} (bloqueado)`}
                >
                  <Lock size={28} className="text-ink/40" />
                </div>
              ) : (
                <Link
                  href={`/learn/${subjectSlug}/${n.slug}`}
                  className={cn(
                    "group relative flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-pop",
                    "transition-all duration-200 hover:-translate-y-1 hover:scale-105 active:translate-y-1",
                    n.state === "done"
                      ? "border-grass-deep bg-grass text-white"
                      : "border-sky-deep bg-sky text-white",
                  )}
                  aria-label={n.title}
                >
                  {n.state === "done" ? <Check size={32} /> : <Star size={32} />}
                  {n.state === "available" && !reducedMotion && (
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-full border-4 border-sky"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  <span className="pointer-events-none absolute -bottom-7 left-1/2 max-w-[180px] -translate-x-1/2 truncate rounded-full bg-white px-3 py-0.5 text-xs font-extrabold text-ink shadow-pop">
                    {n.title}
                  </span>
                </Link>
              )}
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
