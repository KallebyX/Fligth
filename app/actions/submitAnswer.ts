"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { nextReviewBoolean, type SrsState } from "@/lib/srs/sm2";
import { computeHearts, loseHeart } from "@/lib/hearts";

export type SubmitAnswerInput = {
  questionId: number;
  choice: "A" | "B" | "C" | "D";
  context: "lesson" | "review"; // 'review' won't deduct hearts.
  wasFirstTry?: boolean;
};

export type SubmitAnswerResult =
  | {
      ok: true;
      correct: boolean;
      correctChoice: "A" | "B" | "C" | "D";
      explanation: string | null;
      hearts: number;
    }
  | { ok: false; error: string };

export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // 1. Fetch the question with its correct answer.
  // The `questions` table has a deny-all RLS policy on SELECT (so the answer
  // never leaks to clients via questions_public). Reading `correct` therefore
  // must go through the service-role client server-side.
  const service = createServiceClient();
  const { data: question, error: qErr } = await service
    .from("questions")
    .select("id, correct, explanation_md")
    .eq("id", input.questionId)
    .single();
  if (qErr || !question) {
    console.error("[submitAnswer] question lookup failed", { id: input.questionId, qErr });
    return { ok: false, error: "question_not_found" };
  }

  const correct = question.correct === input.choice;

  // 2. Update SRS state for this user/question.
  const { data: prevAttempt } = await supabase
    .from("user_question_attempts")
    .select("sm2_easiness, sm2_interval, sm2_repetitions")
    .eq("user_id", user.id)
    .eq("question_id", input.questionId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevState: SrsState = prevAttempt
    ? {
        easiness: prevAttempt.sm2_easiness,
        interval: prevAttempt.sm2_interval,
        repetitions: prevAttempt.sm2_repetitions,
      }
    : { easiness: 2.5, interval: 0, repetitions: 0 };

  const srs = nextReviewBoolean(prevState, correct, input.wasFirstTry ?? true);

  await supabase.from("user_question_attempts").insert({
    user_id: user.id,
    question_id: input.questionId,
    attempted_at: new Date().toISOString(),
    was_correct: correct,
    sm2_easiness: srs.easiness,
    sm2_interval: srs.interval,
    sm2_repetitions: srs.repetitions,
    due_at: srs.due_at,
  });

  // 3. Hearts (only deduct in lesson context).
  const { data: stats } = await supabase
    .from("user_stats")
    .select("hearts, hearts_regen_at")
    .eq("user_id", user.id)
    .single();

  let heartsLeft = stats?.hearts ?? 5;

  if (stats) {
    // First refresh from regen.
    const refreshed = computeHearts(stats);
    let next = refreshed;

    if (input.context === "lesson" && !correct) {
      next = loseHeart({
        hearts: refreshed.hearts,
        hearts_regen_at: refreshed.hearts_regen_at,
      });
    }

    if (refreshed.changed || next !== refreshed) {
      await supabase
        .from("user_stats")
        .update({ hearts: next.hearts, hearts_regen_at: next.hearts_regen_at })
        .eq("user_id", user.id);
    }
    heartsLeft = next.hearts;
  }

  return {
    ok: true,
    correct,
    correctChoice: question.correct,
    explanation: question.explanation_md,
    hearts: heartsLeft,
  };
}
