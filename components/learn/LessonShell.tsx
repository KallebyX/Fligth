"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LessonRunner } from "@/components/learn/LessonRunner";
import type { PlayerQuestion } from "@/components/learn/QuestionPlayer";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { ChevronLeft, PlayCircle, BookOpen } from "lucide-react";

export type LessonShellProps = {
  lessonId: number;
  title: string;
  theory: string | null;
  questionCount: number;
  questions: PlayerQuestion[];
  subjectName: string;
  subjectColor: string;
  unitTitle: string;
};

export function LessonShell({
  lessonId,
  title,
  theory,
  questionCount,
  questions,
  subjectName,
  subjectColor,
  unitTitle,
}: LessonShellProps) {
  const [stage, setStage] = useState<"intro" | "run">(theory ? "intro" : "run");

  if (stage === "run") {
    return <LessonRunner lessonId={lessonId} questions={questions} />;
  }

  return (
    <main className="container max-w-2xl pb-24 pt-4">
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
      >
        <div
          className="rounded-2xl p-5 text-white shadow-pop"
          style={{ backgroundColor: subjectColor }}
        >
          <p className="text-[11px] uppercase tracking-wider opacity-80">{subjectName} · {unitTitle}</p>
          <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">{title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm opacity-90">
            <BookOpen size={16} />
            {questionCount} questões nesta lição
          </p>
        </div>
      </motion.div>

      {theory && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card-pop mt-5 p-6"
        >
          <header className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink/50">
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
        className="card-pop mt-5 flex items-center gap-4 bg-sky/5 p-5"
      >
        <Mascot state="happy" size={64} />
        <div className="flex-1">
          <p className="text-base font-extrabold">Pronto pra praticar?</p>
          <p className="text-sm text-ink/70">
            Em cada questão você ganha XP. Erros descontam um coração — mas você recupera com o
            tempo.
          </p>
        </div>
      </motion.div>

      <div className="sticky bottom-4 mt-6">
        <Button
          size="lg"
          className="w-full shadow-pop-lg"
          onClick={() => setStage("run")}
        >
          <PlayCircle size={20} />
          Começar lição
        </Button>
      </div>
    </main>
  );
}
