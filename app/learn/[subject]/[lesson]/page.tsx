import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonShell } from "@/components/learn/LessonShell";
import type { PlayerQuestion } from "@/components/learn/QuestionPlayer";

export const dynamic = "force-dynamic";

type Params = { subject: string; lesson: string };

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { subject: subjectSlug, lesson: lessonSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, color")
    .eq("slug", subjectSlug)
    .single();
  if (!subject) notFound();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, slug, title, theory_md, xp_reward, unit_id")
    .eq("subject_id", subject.id)
    .eq("slug", lessonSlug)
    .single();
  if (!lesson) notFound();

  const { data: unit } = await supabase
    .from("units")
    .select("title")
    .eq("id", lesson.unit_id)
    .single();

  // Pull up to 8 questions for this lesson (or fall back to subject questions).
  const { data: lessonQuestions } = await supabase
    .from("questions_public")
    .select("id, stem, choice_a, choice_b, choice_c, choice_d")
    .eq("lesson_id", lesson.id)
    .limit(8);

  let questions = lessonQuestions ?? [];
  if (questions.length < 4) {
    const { data: fallback } = await supabase
      .from("questions_public")
      .select("id, stem, choice_a, choice_b, choice_c, choice_d")
      .eq("subject_id", subject.id)
      .limit(8);
    questions = fallback ?? [];
  }

  const playerQuestions: PlayerQuestion[] = questions.map((q) => ({
    id: q.id,
    stem: q.stem,
    choices: { A: q.choice_a, B: q.choice_b, C: q.choice_c, D: q.choice_d },
  }));

  // Check user's hearts before starting.
  const { data: stats } = await supabase
    .from("user_stats")
    .select("hearts")
    .eq("user_id", user.id)
    .single();
  if ((stats?.hearts ?? 5) <= 0) {
    redirect("/learn?out=hearts");
  }

  return (
    <LessonShell
      lessonId={lesson.id}
      title={lesson.title}
      theory={lesson.theory_md}
      questionCount={playerQuestions.length}
      questions={playerQuestions}
      subjectName={subject.name}
      subjectColor={subject.color}
      unitTitle={unit?.title ?? ""}
    />
  );
}
