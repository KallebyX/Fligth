"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { awardXP, XP_LESSON_COMPLETE_BONUS, XP_PER_CORRECT_LESSON } from "@/lib/xp";
import { bumpStreak } from "@/lib/streak";
import { evaluateBadges } from "@/lib/badges";
import { recordActivity, STREAK_MILESTONES } from "@/lib/activities";
import { todayISO } from "@/lib/utils";

export type CompleteLessonInput = {
  lessonId: number;
  correctCount: number;
  totalCount: number;
};

export type CompleteLessonResult =
  | {
      ok: true;
      xpAwarded: number;
      newStreak: number;
      perfect: boolean;
    }
  | { ok: false; error: string };

export async function completeLesson(input: CompleteLessonInput): Promise<CompleteLessonResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const xpAwarded =
    input.correctCount * XP_PER_CORRECT_LESSON + XP_LESSON_COMPLETE_BONUS;

  // 1. user_progress upsert
  const { data: existing } = await supabase
    .from("user_progress")
    .select("attempts, best_score")
    .eq("user_id", user.id)
    .eq("lesson_id", input.lessonId)
    .maybeSingle();

  const score = Math.round((input.correctCount / Math.max(1, input.totalCount)) * 100);
  await supabase.from("user_progress").upsert({
    user_id: user.id,
    lesson_id: input.lessonId,
    completed_at: new Date().toISOString(),
    best_score: Math.max(existing?.best_score ?? 0, score),
    attempts: (existing?.attempts ?? 0) + 1,
  });

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
    const r = bumpStreak(stats, todayISO());
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

  const perfect = input.correctCount === input.totalCount;

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
  });

  revalidatePath("/learn");
  return { ok: true, xpAwarded, newStreak, perfect };
}
