import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { Progress } from "@/components/ui/progress";
import { ResultsConfetti } from "@/components/exam/ResultsConfetti";
import {
  CheckCircle2,
  ShieldX,
  RotateCw,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import type { SubjectScore } from "@/lib/exam/scoring";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: attempt }, { data: profile }] = await Promise.all([
    supabase
      .from("mock_exam_attempts")
      .select("id, finished_at, scores_by_subject, total_correct, passed, started_at")
      .eq("id", id)
      .single(),
    supabase
      .from("profiles")
      .select("equipped_outfit_slug")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!attempt || !attempt.finished_at) notFound();

  const scores = (attempt.scores_by_subject ?? {}) as Record<string, SubjectScore>;
  const { data: subjects } = await supabase
    .from("subjects")
    .select("slug, name, color")
    .order("order_index");

  const total = attempt.total_correct ?? 0;
  const passed = !!attempt.passed;
  const subjectsList = subjects ?? [];
  const passedSubjects = subjectsList.filter((s) => scores[s.slug]?.passed).length;
  const failedSubjects = subjectsList.length - passedSubjects;

  const durationMs =
    attempt.finished_at && attempt.started_at
      ? new Date(attempt.finished_at).getTime() - new Date(attempt.started_at).getTime()
      : 0;
  const durationLabel = formatDuration(durationMs);

  return (
    <main className="container max-w-3xl py-8">
      {passed && <ResultsConfetti />}

      <div
        className={`relative overflow-hidden rounded-3xl px-5 py-7 text-center text-white shadow-pop ${
          passed ? "bg-grass" : "bg-alert"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"
        />

        <div className="relative flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            {passed ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
            {passed ? "Aprovado" : "Reprovado"}
          </span>

          <div className="rounded-full bg-white/15 p-2 ring-4 ring-white/30">
            <Mascot
              state={passed ? "celebrate" : "sad"}
              size={132}
              outfit={profile?.equipped_outfit_slug}
            />
          </div>

          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            {passed ? "Aprovado!" : "Quase lá."}
          </h1>
          <p className="max-w-md text-sm leading-snug opacity-95">
            {passed
              ? "Você atingiu 70% em todas as 5 matérias — pronto pra encarar a banca da ANAC."
              : "Para passar, você precisa de 70% em cada matéria. Foca nas que ficaram vermelhas e tente de novo."}
          </p>

          <div className="mt-3 grid w-full max-w-md grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/15 px-3 py-2">
              <p className="text-2xl font-black tabular-nums">{total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                / 100
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2">
              <p className="text-2xl font-black tabular-nums">
                {passedSubjects}/{subjectsList.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                Matérias OK
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2">
              <p className="text-2xl font-black tabular-nums">{durationLabel}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                Tempo
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Por matéria</CardTitle>
            <CardDesc>Mínimo: 70% em cada uma.</CardDesc>
          </div>
          {failedSubjects > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-alert/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-alert">
              {failedSubjects} pendente{failedSubjects === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <ul className="space-y-3 pt-1">
          {subjectsList.map((s) => {
            const r = scores[s.slug];
            if (!r) return null;
            return (
              <li key={s.slug}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-extrabold">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        r.passed
                          ? "bg-grass/15 text-grass-deep"
                          : "bg-alert/15 text-alert"
                      }`}
                    >
                      {r.passed ? <CheckCircle2 size={14} /> : <ShieldX size={14} />}
                    </span>
                    <span style={{ color: s.color }}>{s.name}</span>
                  </span>
                  <span
                    className={`tabular-nums text-sm font-extrabold ${
                      r.passed ? "text-grass-deep" : "text-alert"
                    }`}
                  >
                    {r.correct}/{r.total} · {r.pct}%
                  </span>
                </div>
                <Progress
                  value={r.pct}
                  barClassName={r.passed ? "bg-grass" : "bg-alert"}
                />
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
        <Link href="/exam" className="md:w-auto">
          <Button size="lg" variant="warn" className="w-full md:w-auto">
            <RotateCw size={18} />
            Refazer simulado
          </Button>
        </Link>
        <Link href="/learn" className="md:w-auto">
          <Button size="lg" variant="outline" className="w-full md:w-auto">
            <GraduationCap size={18} />
            Voltar às trilhas
          </Button>
        </Link>
      </div>
    </main>
  );
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}min`;
}
