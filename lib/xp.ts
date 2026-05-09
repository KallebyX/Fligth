import type { createClient } from "@/lib/supabase/server";
import { isoWeek } from "@/lib/utils";

type DB = Awaited<ReturnType<typeof createClient>>;

export const XP_PER_CORRECT_LESSON = 10;
export const XP_PER_CORRECT_REVIEW = 5;
export const XP_LESSON_COMPLETE_BONUS = 10;

// Increments user_stats.total_xp and the current league_members.weekly_xp.
// Idempotent? No — the caller is responsible for not double-awarding.
export async function awardXP(supabase: DB, userId: string, amount: number) {
  if (amount <= 0) return;

  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_xp")
    .eq("user_id", userId)
    .single();

  await supabase
    .from("user_stats")
    .update({ total_xp: (stats?.total_xp ?? 0) + amount })
    .eq("user_id", userId);

  // Find or create the user's league membership for this week.
  const week = isoWeek();
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_league")
    .eq("id", userId)
    .single();

  const division = profile?.current_league ?? "bronze";

  let { data: league } = await supabase
    .from("leagues")
    .select("id")
    .eq("iso_week", week)
    .eq("division", division)
    .maybeSingle();

  if (!league) {
    const { data: created } = await supabase
      .from("leagues")
      .insert({ iso_week: week, division })
      .select("id")
      .single();
    league = created ?? null;
  }

  if (!league) return;

  const { data: member } = await supabase
    .from("league_members")
    .select("weekly_xp")
    .eq("league_id", league.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (member) {
    await supabase
      .from("league_members")
      .update({ weekly_xp: member.weekly_xp + amount })
      .eq("league_id", league.id)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: userId, weekly_xp: amount });
  }
}
