import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewRunner } from "@/components/learn/ReviewRunner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { todayISO } from "@/lib/utils";
import type { PlayerQuestion } from "@/components/learn/QuestionPlayer";

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
      <main className="container flex min-h-[80vh] flex-col items-center justify-center gap-6 py-12 text-center">
        <Mascot state="happy" size={140} />
        <h1 className="text-2xl font-black md:text-3xl">Sem revisões hoje!</h1>
        <Card className="max-w-md text-left">
          <CardTitle className="mb-2">Como funciona</CardTitle>
          <CardDesc>
            Cada questão errada volta no momento certo (1, 3, 7 dias e além) usando o algoritmo
            SM-2. Continue completando lições e novas revisões aparecerão aqui automaticamente.
          </CardDesc>
        </Card>
        <Link href="/learn">
          <Button size="lg">Voltar às trilhas</Button>
        </Link>
      </main>
    );
  }

  // Cap at 20 per session.
  const ids = dueIds.slice(0, 20);
  const { data: questions } = await supabase
    .from("questions_public")
    .select("id, stem, choice_a, choice_b, choice_c, choice_d")
    .in("id", ids);

  const playerQuestions: PlayerQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    stem: q.stem,
    choices: { A: q.choice_a, B: q.choice_b, C: q.choice_c, D: q.choice_d },
  }));

  return (
    <main className="pb-24">
      <div className="container max-w-2xl py-6">
        <h1 className="text-2xl font-black md:text-3xl">Revisão de hoje</h1>
        <p className="text-sm text-ink/70">
          {playerQuestions.length} questões aguardando — sem perder vidas, fique calmo.
        </p>
      </div>
      <ReviewRunner questions={playerQuestions} />
    </main>
  );
}
