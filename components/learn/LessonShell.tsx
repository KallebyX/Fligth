"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LessonRunner } from "@/components/learn/LessonRunner";
import type { Exercise } from "@/components/learn/exercises/types";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import {
  BookOpen,
  ChevronLeft,
  Heart,
  PlayCircle,
  Sparkles,
  Star,
} from "lucide-react";

export type LessonShellProps = {
  lessonId: number;
  title: string;
  theory: string | null;
  questionCount: number;
  exercises: Exercise[];
  subjectName: string;
  subjectColor: string;
  unitTitle: string;
  hearts: number;
  gems: number;
  mascotOutfit: string | null;
};

export function LessonShell({
  lessonId,
  title,
  theory,
  questionCount,
  exercises,
  subjectName,
  subjectColor,
  unitTitle,
  hearts,
  gems,
  mascotOutfit,
}: LessonShellProps) {
  const [stage, setStage] = useState<"intro" | "run">(theory ? "intro" : "run");

  if (stage === "run") {
    return (
      <LessonRunner
        lessonId={lessonId}
        exercises={exercises}
        initialHearts={hearts}
        initialGems={gems}
        mascotOutfit={mascotOutfit}
      />
    );
  }

  const xpReward = questionCount * 10 + 10; // mirrors XP_PER_CORRECT_LESSON * count + bonus

  return (
    <main className="container max-w-2xl pb-32 pt-4">
      <Link
        href="/learn"
        className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={16} />
        Voltar para as trilhas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-pop"
        style={{ backgroundColor: subjectColor }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"
        />

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-85">
            {subjectName} · {unitTitle}
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">
            {title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold uppercase tracking-wider">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              <BookOpen size={14} />
              {questionCount} questões
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              <Star size={14} />
              até {xpReward} XP
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              <Heart size={14} />
              {hearts} {hearts === 1 ? "vida" : "vidas"}
            </span>
          </div>
        </div>
      </motion.div>

      {theory && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card-pop mt-5 p-5 md:p-6"
        >
          <header className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/55">
            <BookOpen size={14} />
            <span>O que estudar antes</span>
            <span className="h-px flex-1 bg-cloud-deep/40" />
          </header>
          <Markdown content={theory} />
        </motion.section>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card-pop mt-5 flex items-center gap-4 bg-gradient-to-r from-sky/10 to-grass/10 p-5"
      >
        <div className="shrink-0 rounded-full bg-white/80 p-1.5 ring-2 ring-sky/30">
          <Mascot state="happy" size={72} outfit={mascotOutfit} />
        </div>
        <div className="flex-1">
          <p className="flex items-center gap-1 text-base font-extrabold text-ink">
            <Sparkles size={16} className="text-sky" />
            Vamos voar!
          </p>
          <p className="mt-0.5 text-sm leading-snug text-ink/70">
            Cada acerto vale XP. Erros descontam uma vida — você recupera 1 a
            cada 30 min. Acertou tudo? Voo perfeito + bônus.
          </p>
        </div>
      </motion.div>

      <div
        className="sticky bottom-4 mt-6"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Button
          size="lg"
          className="w-full shadow-pop-lg"
          onClick={() => setStage("run")}
          style={{ backgroundColor: subjectColor }}
        >
          <PlayCircle size={20} />
          Começar lição
        </Button>
      </div>
    </main>
  );
}
