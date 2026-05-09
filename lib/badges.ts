import type { createClient } from "@/lib/supabase/server";

type DB = Awaited<ReturnType<typeof createClient>>;

// Catalog of badges (also seeded in scripts/seed.ts).
// `criterion` is matched here on application events.
export type BadgeCriterion =
  | { type: "first_lesson" }
  | { type: "streak"; days: number }
  | { type: "total_xp"; xp: number }
  | { type: "exam_passed" }
  | { type: "perfect_lesson" };

type Ctx = {
  userId: string;
  event: "lesson_completed" | "exam_finished";
  data?: {
    perfect?: boolean;
    examPassed?: boolean;
  };
};

export async function evaluateBadges(supabase: DB, ctx: Ctx) {
  const [{ data: stats }, { data: owned }, { data: catalog }] = await Promise.all([
    supabase
      .from("user_stats")
      .select("total_xp, current_streak")
      .eq("user_id", ctx.userId)
      .single(),
    supabase.from("user_badges").select("badge_id").eq("user_id", ctx.userId),
    supabase.from("badges").select("id, slug, criterion"),
  ]);
  if (!stats || !catalog) return;

  const ownedSet = new Set((owned ?? []).map((b) => b.badge_id));
  const toAward: number[] = [];

  for (const badge of catalog) {
    if (ownedSet.has(badge.id)) continue;
    const c = badge.criterion as BadgeCriterion;
    let earned = false;

    switch (c.type) {
      case "first_lesson":
        earned = ctx.event === "lesson_completed";
        break;
      case "streak":
        earned = stats.current_streak >= c.days;
        break;
      case "total_xp":
        earned = stats.total_xp >= c.xp;
        break;
      case "exam_passed":
        earned = ctx.event === "exam_finished" && Boolean(ctx.data?.examPassed);
        break;
      case "perfect_lesson":
        earned = ctx.event === "lesson_completed" && Boolean(ctx.data?.perfect);
        break;
    }

    if (earned) toAward.push(badge.id);
  }

  if (toAward.length === 0) return;

  await supabase
    .from("user_badges")
    .insert(toAward.map((badge_id) => ({ user_id: ctx.userId, badge_id, earned_at: new Date().toISOString() })));
}
