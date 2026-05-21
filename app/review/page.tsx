import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewRunner } from "@/components/learn/ReviewRunner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { todayISO } from "@/lib/utils";
import type { Exercise } from "@/components/learn/exercises/types";
import {
  EXERCISE_SELECT,
  toExercise,
  type QuestionRow,
} from "@/lib/exercises/toExercise";
import { GraduationCap, RotateCw, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find latest attempt per question (with due_at <= today).
  const today = todayISO();
  const { data: due } = await supabase
    .from("user_question_attempts")
    .select("question_id, due_at, attempted_at")
    .eq("user_id", user.id)
    .lte("due_at", today)
    .order("attempted_at", { ascending: false });

  // Dedupe — keep only the most recent attempt per question_id.
  const seen = new Set<number>();
  const dueIds: number[] = [];
  for (const a of due ?? []) {
    if (!seen.has(a.question_id)) {
      seen.add(a.question_id);
      dueIds.push(a.question_id);
    }
  }

  if (dueIds.length === 0) {
    return (
      <main className="container max-w-2xl space-y-5 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-grass to-sky text-white shadow-pop">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15"
          />
          <div className="relative grid items-center gap-3 px-5 py-7 text-center sm:grid-cols-[auto,1fr] sm:text-left">
            <div className="flex justify-center">
              <div className="rounded-full bg-white/15 p-2 ring-4 ring-white/30">
                <Mascot state="celebrate" size={120} />
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={12} />
                Tudo em dia
              </span>
              <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">
                Sem revisões hoje!
              </h1>
              <p className="mt-1 text-sm leading-snug opacity-95">
                Volte amanhã ou complete novas lições — questões erradas voltam
                automaticamente.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardTitle>Como o SRS funciona</CardTitle>
          <CardDesc className="mt-1">
            Cada questão errada volta no momento certo. Algoritmo SM-2.
          </CardDesc>
          <ol className="mt-4 space-y-3 text-sm text-ink/80">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-deep font-extrabold">
                1
              </span>
              Acertou de primeira? Volta em 6 dias.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-deep font-extrabold">
                2
              </span>
              Errou? Volta amanhã pra você fixar.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-deep font-extrabold">
                3
              </span>
              Acertou de novo? Intervalo cresce (14d, 1m, 3m…).
            </li>
          </ol>
        </Card>

        <Link href="/learn">
          <Button size="lg" className="w-full">
            <GraduationCap size={18} />
            Voltar às trilhas
          </Button>
        </Link>
      </main>
    );
  }

  // Cap at 20 per session. Exclude theory_step from review (mini-aulas
  // are pedagogical, not assessment — they don't make sense as SRS items
  // even when persisted from a prior lesson).
  const ids = dueIds.slice(0, 20);
  const { data: questions } = await supabase
    .from("questions_public")
    .select(EXERCISE_SELECT)
    .in("id", ids)
    .neq("kind", "theory_step");

  const { data: profile } = await supabase
    .from("profiles")
    .select("equipped_outfit_slug")
    .eq("id", user.id)
    .single();

  const exercises = ((questions ?? []) as QuestionRow[])
    .map(toExercise)
    .filter((e): e is Exercise => e !== null);

  return (
    <main>
      <div className="container max-w-2xl py-5">
        <div className="card-pop flex items-center gap-3 p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-deep">
            <RotateCw size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/55">
              Revisão de hoje
            </p>
            <p className="text-base font-extrabold leading-tight">
              {exercises.length}{" "}
              {exercises.length === 1 ? "questão pendente" : "questões pendentes"}
            </p>
            <p className="text-xs text-ink/60">Sem perder vidas — só pra fixar.</p>
          </div>
        </div>
      </div>
      <ReviewRunner
        exercises={exercises}
        mascotOutfit={profile?.equipped_outfit_slug ?? null}
      />
    </main>
  );
}
