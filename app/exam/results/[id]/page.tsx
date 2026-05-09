import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { Progress } from "@/components/ui/progress";
import type { SubjectScore } from "@/lib/exam/scoring";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select("id, finished_at, scores_by_subject, total_correct, passed, started_at")
    .eq("id", id)
    .single();

  if (!attempt || !attempt.finished_at) notFound();

  const scores = (attempt.scores_by_subject ?? {}) as Record<string, SubjectScore>;
  const { data: subjects } = await supabase
    .from("subjects")
    .select("slug, name, color")
    .order("order_index");

  return (
    <main className="container max-w-3xl py-10">
      <div className="mb-8 text-center">
        <Mascot state={attempt.passed ? "celebrate" : "sad"} size={140} />
        <h1 className="mt-4 text-4xl font-black md:text-5xl">
          {attempt.passed ? "APROVADO!" : "Quase lá."}
        </h1>
        <p className="mt-2 text-base text-ink/70">
          Você acertou{" "}
          <strong>
            {attempt.total_correct}
            /100
          </strong>{" "}
          questões. {attempt.passed
            ? "Atingiu 70% em todas as matérias."
            : "Para passar, você precisa de 70% em CADA matéria."}
        </p>
      </div>

      <Card className="space-y-4">
        <CardTitle>Resultado por matéria</CardTitle>
        <CardDesc>Mínimo: 70% em cada uma.</CardDesc>

        <div className="space-y-4 pt-2">
          {(subjects ?? []).map((s) => {
            const r = scores[s.slug];
            if (!r) return null;
            return (
              <div key={s.slug}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: s.color }}>
                    {s.name}
                  </span>
                  <span className={r.passed ? "font-extrabold text-grass" : "font-extrabold text-alert"}>
                    {r.correct}/{r.total} · {r.pct}%
                  </span>
                </div>
                <Progress
                  value={r.pct}
                  barClassName={r.passed ? "bg-grass" : "bg-alert"}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-center">
        <Link href="/exam">
          <Button size="lg" variant="warn" className="w-full md:w-auto">
            Refazer simulado
          </Button>
        </Link>
        <Link href="/learn">
          <Button size="lg" variant="outline" className="w-full md:w-auto">
            Voltar às trilhas
          </Button>
        </Link>
      </div>
    </main>
  );
}
