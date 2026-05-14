"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { scoreExam, type ExamAnswers, type ExamQuestion } from "@/lib/exam/scoring";
import { evaluateBadges } from "@/lib/badges";
import { recordActivity } from "@/lib/activities";

const QUESTIONS_PER_SUBJECT = 20;

export type StartExamResult =
  | {
      ok: true;
      attemptId: string;
      questions: {
        id: number;
        subject_slug: string;
        subject_name: string;
        stem: string;
        choices: Record<"A" | "B" | "C" | "D", string>;
      }[];
    }
  | { ok: false; error: string };

export async function startExam(): Promise<StartExamResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, slug, name")
    .order("order_index");
  if (!subjects?.length) return { ok: false, error: "no_subjects" };

  // For each subject, pick 20 random questions.
  // We use a service client to bypass RLS on the `questions` table —
  // the row data leaving the server is sanitized to never include `correct`.
  const service = createServiceClient();

  const all: NonNullable<StartExamResult & { ok: true }>["questions"] = [];
  const idToSubjectSlug = new Map<number, string>();

  for (const subj of subjects) {
    const { data } = await service
      .from("questions")
      .select("id, stem, choice_a, choice_b, choice_c, choice_d")
      .eq("subject_id", subj.id)
      .eq("kind", "multiple_choice")
      .limit(200);

    const pool = data ?? [];
    // Shuffle and take 20 (or as many as available).
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, QUESTIONS_PER_SUBJECT);

    for (const q of picked) {
      idToSubjectSlug.set(q.id, subj.slug);
      all.push({
        id: q.id,
        subject_slug: subj.slug,
        subject_name: subj.name,
        stem: q.stem,
        choices: { A: q.choice_a, B: q.choice_b, C: q.choice_c, D: q.choice_d },
      });
    }
  }

  // Persist the attempt with the sequence of question IDs so we can score later.
  const { data: attempt, error } = await supabase
    .from("mock_exam_attempts")
    .insert({
      user_id: user.id,
      started_at: new Date().toISOString(),
      answers: { question_ids: all.map((q) => q.id) },
    })
    .select("id")
    .single();
  if (error || !attempt) return { ok: false, error: error?.message ?? "insert_failed" };

  return { ok: true, attemptId: attempt.id, questions: all };
}

export type SubmitExamResult =
  | {
      ok: true;
      passed: boolean;
      attemptId: string;
    }
  | { ok: false; error: string };

export async function submitExam(input: {
  attemptId: string;
  answers: ExamAnswers;
}): Promise<SubmitExamResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select("id, user_id, finished_at, answers")
    .eq("id", input.attemptId)
    .single();
  if (!attempt || attempt.user_id !== user.id) return { ok: false, error: "not_found" };
  if (attempt.finished_at) return { ok: false, error: "already_finished" };

  const ids = ((attempt.answers as { question_ids?: number[] } | null)?.question_ids ?? []) as number[];

  const service = createServiceClient();
  const { data: questions } = await service
    .from("questions")
    .select("id, subject_id, correct")
    .in("id", ids);

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, slug");
  const subjBySlug = new Map((subjects ?? []).map((s) => [s.id, s.slug]));

  const examQs: ExamQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    subject_slug: subjBySlug.get(q.subject_id) ?? "unknown",
    correct: q.correct,
  }));

  const result = scoreExam(input.answers, examQs);

  await supabase
    .from("mock_exam_attempts")
    .update({
      finished_at: new Date().toISOString(),
      scores_by_subject: result.by_subject,
      total_correct: result.total_correct,
      passed: result.passed,
      answers: { question_ids: ids, choices: input.answers },
    })
    .eq("id", input.attemptId);

  await evaluateBadges(supabase, {
    userId: user.id,
    event: "exam_finished",
    data: { examPassed: result.passed },
  });

  if (result.passed) {
    await recordActivity(user.id, "exam_passed", {
      attempt_id: input.attemptId,
      total_correct: result.total_correct,
    });
  }

  revalidatePath("/profile");
  return { ok: true, passed: result.passed, attemptId: input.attemptId };
}
