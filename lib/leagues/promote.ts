import type { createServiceClient } from "@/lib/supabase/server";
import { isoWeek } from "@/lib/utils";

type DB = ReturnType<typeof createServiceClient>;

export const DIVISIONS = ["bronze", "prata", "ouro", "diamante"] as const;
export type Division = (typeof DIVISIONS)[number];

export const PROMOTE_TOP = 10;
export const RELEGATE_BOTTOM = 5;

function nextDivision(d: Division): Division {
  const i = DIVISIONS.indexOf(d);
  return DIVISIONS[Math.min(i + 1, DIVISIONS.length - 1)];
}

function prevDivision(d: Division): Division {
  const i = DIVISIONS.indexOf(d);
  return DIVISIONS[Math.max(i - 1, 0)];
}

// Closes the previous ISO week's leagues and promotes/relegates members.
// Idempotent w.r.t. `next_week` (uses upserts and skips existing memberships).
export async function promoteWeek(supabase: DB, opts: { previousWeek?: string } = {}) {
  const previousWeek =
    opts.previousWeek ?? isoWeek(new Date(Date.now() - 7 * 24 * 3600 * 1000));
  const nextWeek = isoWeek();

  for (const division of DIVISIONS) {
    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("iso_week", previousWeek)
      .eq("division", division)
      .maybeSingle();
    if (!league) continue;

    const { data: members } = await supabase
      .from("league_members")
      .select("user_id, weekly_xp")
      .eq("league_id", league.id)
      .order("weekly_xp", { ascending: false });
    if (!members || members.length === 0) continue;

    const promoted = members.slice(0, PROMOTE_TOP).map((m) => m.user_id);
    const relegated = members.slice(-RELEGATE_BOTTOM).map((m) => m.user_id);

    for (const uid of promoted) {
      await supabase.from("profiles").update({ current_league: nextDivision(division) }).eq("id", uid);
    }
    for (const uid of relegated) {
      // Avoid double-mutating users that overlap (small leagues).
      if (!promoted.includes(uid)) {
        await supabase.from("profiles").update({ current_league: prevDivision(division) }).eq("id", uid);
      }
    }
  }

  // Reset weekly XP by simply not migrating it: weekly_xp lives per-(league,user).
  // The fresh `nextWeek` league is created lazily on first XP award.
  return { previousWeek, nextWeek };
}
