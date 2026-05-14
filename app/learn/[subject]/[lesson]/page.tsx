import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonShell } from "@/components/learn/LessonShell";
import type { Exercise } from "@/components/learn/exercises/types";
import {
  EXERCISE_SELECT,
  toExercise,
  type QuestionRow,
} from "@/lib/exercises/toExercise";

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

  const { data: lessonQuestions } = await supabase
    .from("questions_public")
    .select(EXERCISE_SELECT)
    .eq("lesson_id", lesson.id)
    .limit(8);

  let rows = (lessonQuestions ?? []) as QuestionRow[];
  if (rows.length < 4) {
    const { data: fallback } = await supabase
      .from("questions_public")
      .select(EXERCISE_SELECT)
      .eq("subject_id", subject.id)
      .limit(8);
    rows = (fallback ?? []) as QuestionRow[];
  }

  const exercises = rows
    .map(toExercise)
    .filter((e): e is Exercise => e !== null);

  const { data: stats } = await supabase
    .from("user_stats")
    .select("hearts, gems")
    .eq("user_id", user.id)
    .single();
  if ((stats?.hearts ?? 5) <= 0) {
    redirect("/learn?out=hearts");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("equipped_outfit_slug")
    .eq("id", user.id)
    .single();

  return (
    <LessonShell
      lessonId={lesson.id}
      title={lesson.title}
      theory={lesson.theory_md}
      questionCount={exercises.length}
      exercises={exercises}
      subjectName={subject.name}
      subjectColor={subject.color}
      unitTitle={unit?.title ?? ""}
      hearts={stats?.hearts ?? 5}
      gems={stats?.gems ?? 0}
      mascotOutfit={profile?.equipped_outfit_slug ?? null}
    />
  );
}
