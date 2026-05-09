import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonRunner } from "@/components/learn/LessonRunner";
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

  // Look up subject -> unit/lesson by slug.
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name")
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
    <>
      {lesson.theory_md && (
        <article className="container max-w-2xl py-6">
          <h1 className="mb-3 text-2xl font-black">{lesson.title}</h1>
          <div className="whitespace-pre-line text-base leading-relaxed text-ink/80">
            {lesson.theory_md}
          </div>
          <hr className="my-6 border-cloud-deep/50" />
          <p className="text-sm font-bold uppercase tracking-wide text-ink/50">
            Hora das questões — {playerQuestions.length} no total
          </p>
        </article>
      )}
      <LessonRunner lessonId={lesson.id} questions={playerQuestions} />
    </>
  );
}
