"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UseFreezeResult =
  | { ok: true; freezesLeft: number; current_streak: number }
  | { ok: false; error: string };

export async function useStreakFreeze(): Promise<UseFreezeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: stats } = await supabase
    .from("user_stats")
    .select("current_streak, streak_freezes, last_activity_date")
    .eq("user_id", user.id)
    .single();
  if (!stats) return { ok: false, error: "no_stats" };

  if ((stats.streak_freezes ?? 0) <= 0) {
    return { ok: false, error: "no_freezes" };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (stats.last_activity_date === today) {
    return { ok: false, error: "already_active_today" };
  }

  const newFreezes = (stats.streak_freezes ?? 0) - 1;
  const { error } = await supabase
    .from("user_stats")
    .update({
      streak_freezes: newFreezes,
      last_activity_date: today,
    })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/learn");
  return {
    ok: true,
    freezesLeft: newFreezes,
    current_streak: stats.current_streak ?? 0,
  };
}
