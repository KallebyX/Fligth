import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonShell } from "@/components/learn/LessonShell";
import type { Exercise } from "@/components/learn/exercises/types";
import type {
  FillBlankPayload,
  MatchPairsPayload,
  TapTilesPayload,
  TheoryStepPayload,
  TrueFalsePayload,
} from "@/lib/exercises/types";

export const dynamic = "force-dynamic";

type Params = { subject: string; lesson: string };

type RawRow = {
  id: number;
  stem: string;
  kind: string | null;
  payload: unknown;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
};

function toExercise(row: RawRow): Exercise | null {
  const kind = (row.kind ?? "multiple_choice") as Exercise["kind"];
  switch (kind) {
    case "multiple_choice":
      return {
        id: row.id,
        kind,
        stem: row.stem,
        choices: {
          A: row.choice_a,
          B: row.choice_b,
          C: row.choice_c,
          D: row.choice_d,
        },
      };
    case "match_pairs":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as MatchPairsPayload }
        : null;
    case "fill_blank":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as FillBlankPayload }
        : null;
    case "true_false":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as TrueFalsePayload }
        : null;
    case "tap_tiles":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as TapTilesPayload }
        : null;
    case "theory_step":
      return row.payload
        ? { id: row.id, kind, stem: row.stem, payload: row.payload as TheoryStepPayload }
        : null;
    default:
      return null;
  }
}

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

  const cols = "id, stem, kind, payload, choice_a, choice_b, choice_c, choice_d";

  const { data: lessonQuestions } = await supabase
    .from("questions_public")
    .select(cols)
    .eq("lesson_id", lesson.id)
    .limit(8);

  let rows = (lessonQuestions ?? []) as RawRow[];
  if (rows.length < 4) {
    const { data: fallback } = await supabase
      .from("questions_public")
      .select(cols)
      .eq("subject_id", subject.id)
      .limit(8);
    rows = (fallback ?? []) as RawRow[];
  }

  const exercises = rows
    .map(toExercise)
    .filter((e): e is Exercise => e !== null);

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
      questionCount={exercises.length}
      exercises={exercises}
      subjectName={subject.name}
      subjectColor={subject.color}
      unitTitle={unit?.title ?? ""}
    />
  );
}
