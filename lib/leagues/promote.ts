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
import { notifyUser } from "@/lib/notifications";
import { getDropPool, pickWeighted } from "@/lib/outfits/catalog";

type DB = ReturnType<typeof createServiceClient>;

// Gems awarded per finishing position inside a closed weekly league.
function rewardForRank(rank: number): number {
  if (rank === 1) return 50;
  if (rank <= 3) return 30;
  if (rank <= PROMOTE_TOP) return 10;
  return 0;
}

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

    const rarePool = await getDropPool(["rare"]);

    for (let i = 0; i < promoted.length; i++) {
      const uid = promoted[i].user_id;
      const rank = i + 1;
      await supabase
        .from("profiles")
        .update({ current_league: target })
        .eq("id", uid);

      const gems = rewardForRank(rank);
      let awardedOutfit: { slug: string; name: string } | null = null;

      if (rank === 1 && rarePool.length > 0) {
        const drop = pickWeighted(rarePool);
        if (drop) {
          const { data: existing } = await supabase
            .from("user_outfits")
            .select("outfit_slug")
            .eq("user_id", uid)
            .eq("outfit_slug", drop.slug)
            .maybeSingle();
          if (!existing) {
            await supabase.from("user_outfits").insert({
              user_id: uid,
              outfit_slug: drop.slug,
              acquired_via: "league_reward",
            });
            awardedOutfit = { slug: drop.slug, name: drop.name };
          }
        }
      }

      if (gems > 0) {
        const { data: stats } = await supabase
          .from("user_stats")
          .select("gems")
          .eq("user_id", uid)
          .single();
        const balance = (stats?.gems ?? 0) + gems;
        await supabase
          .from("user_stats")
          .update({ gems: balance })
          .eq("user_id", uid);
      }

      await recordActivity(uid, "league_promoted", {
        from: division.slug,
        to: target,
        rank,
        gems,
        outfit: awardedOutfit,
      });
      await notifyUser(uid, "league_promoted", {
        from: division.slug,
        to: target,
        rank,
        gems,
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
