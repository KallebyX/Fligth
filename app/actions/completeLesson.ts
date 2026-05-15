"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  awardXP,
  XP_LESSON_COMPLETE_BONUS,
  XP_PER_CORRECT_LESSON,
  XP_PER_THEORY,
} from "@/lib/xp";
import { bumpStreak } from "@/lib/streak";
import { evaluateBadges } from "@/lib/badges";
import { recordActivity, STREAK_MILESTONES } from "@/lib/activities";
import { todayISO } from "@/lib/utils";

export type CompleteLessonInput = {
  lessonId: number;
  correctCount: number;
  totalCount: number;
  // Mini-aulas (theory_step) sempre marcam correct=true mas só rendem XP
  // reduzido, e NÃO contam pro cálculo de "perfect lesson".
  theoryCount?: number;
  hasMixedKinds?: boolean;
  // Practice mode: re-fazer uma lição já completada não dá XP, não bump
  // streak, não conta no feed — só registra um attempt em user_progress.
  isPractice?: boolean;
};

export type CompleteLessonResult =
  | {
      ok: true;
      xpAwarded: number;
      newStreak: number;
      perfect: boolean;
      theoryCount: number;
      goalJustHit: boolean;
    }
  | { ok: false; error: string };

export async function completeLesson(input: CompleteLessonInput): Promise<CompleteLessonResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const isPractice = input.isPractice ?? false;
  const theoryCount = input.theoryCount ?? 0;
  // correctCount already inclui theory_step (que sempre marca correct=true
  // no submitAnswer), então subtrair pra calcular XP avaliativo.
  const assessmentCorrect = Math.max(0, input.correctCount - theoryCount);
  const assessmentTotal = Math.max(0, input.totalCount - theoryCount);
  const perfect = assessmentTotal > 0 && assessmentCorrect === assessmentTotal;
  const xpAwarded = isPractice
    ? 0
    : assessmentCorrect * XP_PER_CORRECT_LESSON +
      theoryCount * XP_PER_THEORY +
      (perfect ? XP_LESSON_COMPLETE_BONUS : 0);

  // 1. user_progress upsert
  const { data: existing } = await supabase
    .from("user_progress")
    .select("attempts, best_score")
    .eq("user_id", user.id)
    .eq("lesson_id", input.lessonId)
    .maybeSingle();

  // best_score reflete só a parte avaliativa (theory_step não vira nota).
  const score = Math.round((assessmentCorrect / Math.max(1, assessmentTotal)) * 100);
  await supabase.from("user_progress").upsert({
    user_id: user.id,
    lesson_id: input.lessonId,
    completed_at: new Date().toISOString(),
    best_score: Math.max(existing?.best_score ?? 0, score),
    attempts: (existing?.attempts ?? 0) + 1,
  });

  // Practice mode short-circuits XP / streak / activity / badges.
  if (isPractice) {
    revalidatePath("/learn");
    return {
      ok: true,
      xpAwarded: 0,
      newStreak: 0,
      perfect,
      theoryCount,
      goalJustHit: false,
    };
  }

  // Capture todayXp BEFORE awarding so we can detect goal crossings.
  const todayKey = todayISO();
  const { data: profileGoal } = await supabase
    .from("profiles")
    .select("daily_goal_xp")
    .eq("id", user.id)
    .single();
  const goalXp = profileGoal?.daily_goal_xp ?? 20;

  const { data: prevToday } = await supabase
    .from("user_activities")
    .select("payload")
    .eq("user_id", user.id)
    .gte("created_at", `${todayKey}T00:00:00.000Z`)
    .lt("created_at", `${todayKey}T23:59:59.999Z`)
    .in("kind", ["lesson_completed", "exam_passed"]);
  const prevTodayXp = (prevToday ?? []).reduce(
    (sum, row) => sum + Number((row.payload as { xp?: number } | null)?.xp ?? 0),
    0,
  );
  const goalJustHit = prevTodayXp < goalXp && prevTodayXp + xpAwarded >= goalXp;

  // 2. XP
  await awardXP(supabase, user.id, xpAwarded);

  // 3. Streak
  const { data: stats } = await supabase
    .from("user_stats")
    .select("current_streak, longest_streak, last_activity_date, streak_freezes")
    .eq("user_id", user.id)
    .single();

  let newStreak = stats?.current_streak ?? 0;
  if (stats) {
    const r = bumpStreak(stats, todayKey);
    if (r.changed) {
      await supabase
        .from("user_stats")
        .update({
          current_streak: r.current_streak,
          longest_streak: r.longest_streak,
          last_activity_date: r.last_activity_date,
          streak_freezes: r.streak_freezes,
        })
        .eq("user_id", user.id);
      newStreak = r.current_streak;
      if (STREAK_MILESTONES.has(r.current_streak)) {
        await recordActivity(user.id, "streak_milestone", {
          streak: r.current_streak,
        });
      }
    }
  }

  // 4. Lesson title (for the feed item).
  const { data: lessonRow } = await supabase
    .from("lessons")
    .select("title, subject_id")
    .eq("id", input.lessonId)
    .single();

  // 5. Badges
  await evaluateBadges(supabase, {
    userId: user.id,
    event: "lesson_completed",
    data: { perfect },
  });

  // 6. Activity feed
  await recordActivity(user.id, "lesson_completed", {
    lesson_id: input.lessonId,
    lesson_title: lessonRow?.title,
    subject_id: lessonRow?.subject_id,
    xp: xpAwarded,
    perfect,
    has_mixed_kinds: input.hasMixedKinds ?? false,
  });

  revalidatePath("/learn");
  return { ok: true, xpAwarded, newStreak, perfect, theoryCount, goalJustHit };
}
