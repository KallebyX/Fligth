import type { createServiceClient } from "@/lib/supabase/server";
import { isoWeek } from "@/lib/utils";
import {
  DIVISIONS,
  PROMOTE_TOP,
  RELEGATE_BOTTOM,
  nextDivision,
  prevDivision,
  type DivisionSlug,
} from "@/lib/leagues/divisions";
import { recordActivity } from "@/lib/activities";

type DB = ReturnType<typeof createServiceClient>;

export { DIVISIONS, PROMOTE_TOP, RELEGATE_BOTTOM };
export type Division = DivisionSlug;

// Closes the previous ISO week's leagues and promotes/relegates members.
// Emits a `league_promoted` activity for each promoted user so the social
// feed picks it up. Idempotent: re-running for the same previousWeek is
// safe because we only update profiles (no double-insert of memberships).
export async function promoteWeek(
  supabase: DB,
  opts: { previousWeek?: string } = {},
) {
  const previousWeek =
    opts.previousWeek ?? isoWeek(new Date(Date.now() - 7 * 24 * 3600 * 1000));
  const nextWeek = isoWeek();

  const summary: Array<{
    division: DivisionSlug;
    promoted: number;
    relegated: number;
  }> = [];

  for (const division of DIVISIONS) {
    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("iso_week", previousWeek)
      .eq("division", division.slug)
      .maybeSingle();
    if (!league) continue;

    const { data: members } = await supabase
      .from("league_members")
      .select("user_id, weekly_xp")
      .eq("league_id", league.id)
      .order("weekly_xp", { ascending: false });
    if (!members || members.length === 0) continue;

    const promoted = members.slice(0, PROMOTE_TOP);
    // Bottom slice; for very small leagues, ignore overlap with top.
    const bottomStart = Math.max(PROMOTE_TOP, members.length - RELEGATE_BOTTOM);
    const relegated = members.slice(bottomStart);

    const target = nextDivision(division.slug);
    const downgrade = prevDivision(division.slug);

    for (let rank = 0; rank < promoted.length; rank++) {
      const uid = promoted[rank].user_id;
      await supabase
        .from("profiles")
        .update({ current_league: target })
        .eq("id", uid);
      await recordActivity(uid, "league_promoted", {
        from: division.slug,
        to: target,
        rank: rank + 1,
      });
    }

    if (downgrade !== division.slug) {
      for (const m of relegated) {
        await supabase
          .from("profiles")
          .update({ current_league: downgrade })
          .eq("id", m.user_id);
      }
    }

    summary.push({
      division: division.slug,
      promoted: promoted.length,
      relegated: downgrade !== division.slug ? relegated.length : 0,
    });
  }

  // Fresh weekly league rows are created lazily on first XP award next week.
  return { previousWeek, nextWeek, summary };
}
