"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type Mission = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  goal_kind: string;
  goal_target: number;
  reward_gems: number;
  reward_xp: number;
  reward_outfit_slug: string | null;
  tier: number;
  order_index: number;
  // Per-user progress (joined). Null when the user has no row yet.
  progress: number;
  completed: boolean;
  claimed: boolean;
};

export type SeasonView = {
  id: number;
  slug: string;
  name: string;
  theme: string | null;
  cover_url: string | null;
  color: string;
  starts_at: string;
  ends_at: string;
  missions: Mission[];
};

// Used by /season page to render the current Battle Pass + the user's
// progress on each mission. One round-trip via a service-client read so
// we can left-join across user_mission_progress without RLS friction.
export async function getCurrentSeason(): Promise<SeasonView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: season } = await service
    .from("seasons")
    .select("id, slug, name, theme, cover_url, color, starts_at, ends_at")
    .lte("starts_at", new Date().toISOString())
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!season) return null;

  const [{ data: missions }, { data: progress }] = await Promise.all([
    service
      .from("missions")
      .select(
        "id, slug, title, description, goal_kind, goal_target, reward_gems, reward_xp, reward_outfit_slug, tier, order_index",
      )
      .eq("season_id", season.id)
      .order("order_index", { ascending: true }),
    service
      .from("user_mission_progress")
      .select("mission_id, progress, completed_at, claimed_at")
      .eq("user_id", user.id),
  ]);

  const progressByMission = new Map(
    (progress ?? []).map((p) => [p.mission_id, p]),
  );

  const enriched: Mission[] = (missions ?? []).map((m) => {
    const p = progressByMission.get(m.id);
    return {
      ...m,
      progress: p?.progress ?? 0,
      completed: !!p?.completed_at,
      claimed: !!p?.claimed_at,
    };
  });

  return { ...season, missions: enriched };
}

export type ClaimResult =
  | { ok: true; gemsAwarded: number; xpAwarded: number; outfitGranted: string | null }
  | { ok: false; error: string };

// Claim a completed mission. Idempotent — the unique constraint on
// (user_id, mission_id) plus the claimed_at NULL check ensures we never
// double-credit. Service-role write because user_stats updates can't be
// done from the user-bound client without elevated perms.
export async function claimMissionReward(missionId: number): Promise<ClaimResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const service = createServiceClient();

  // 1. Load progress row + mission row in parallel.
  const [{ data: progress }, { data: mission }] = await Promise.all([
    service
      .from("user_mission_progress")
      .select("progress, completed_at, claimed_at")
      .eq("user_id", user.id)
      .eq("mission_id", missionId)
      .maybeSingle(),
    service
      .from("missions")
      .select("id, goal_target, reward_gems, reward_xp, reward_outfit_slug")
      .eq("id", missionId)
      .maybeSingle(),
  ]);

  if (!mission) return { ok: false, error: "mission_not_found" };
  if (!progress?.completed_at) return { ok: false, error: "not_completed" };
  if (progress.claimed_at) return { ok: false, error: "already_claimed" };

  // 2. Stamp claimed_at FIRST so concurrent claims race to a single winner.
  const { error: claimErr } = await service
    .from("user_mission_progress")
    .update({ claimed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("mission_id", missionId)
    .is("claimed_at", null);
  if (claimErr) return { ok: false, error: claimErr.message };

  // 3. Credit gems + XP + outfit.
  if (mission.reward_gems > 0 || mission.reward_xp > 0) {
    const { data: stats } = await service
      .from("user_stats")
      .select("gems, total_xp")
      .eq("user_id", user.id)
      .maybeSingle();
    await service
      .from("user_stats")
      .update({
        gems: (stats?.gems ?? 0) + mission.reward_gems,
        total_xp: (stats?.total_xp ?? 0) + mission.reward_xp,
      })
      .eq("user_id", user.id);
  }

  if (mission.reward_outfit_slug) {
    await service
      .from("user_outfits")
      .insert({
        user_id: user.id,
        outfit_slug: mission.reward_outfit_slug,
        // Existing enum doesn't have "mission" — reuse "league_reward"
        // (closest semantic match: outfit granted by an in-game system).
        acquired_via: "league_reward",
      });
  }

  revalidatePath("/season");
  return {
    ok: true,
    gemsAwarded: mission.reward_gems,
    xpAwarded: mission.reward_xp,
    outfitGranted: mission.reward_outfit_slug,
  };
}

// Incrementer hook — fire-and-forget call from completeLesson, submitExam,
// etc. Updates progress on every mission whose goal_kind matches the
// signal. Sets completed_at when progress reaches goal_target.
export async function bumpMissionProgress(
  goalKind: Mission["goal_kind"],
  delta = 1,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const service = createServiceClient();
  const { data: season } = await service
    .from("seasons")
    .select("id")
    .lte("starts_at", new Date().toISOString())
    .gte("ends_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (!season) return;

  const { data: missions } = await service
    .from("missions")
    .select("id, goal_target")
    .eq("season_id", season.id)
    .eq("goal_kind", goalKind);

  for (const m of missions ?? []) {
    const { data: existing } = await service
      .from("user_mission_progress")
      .select("progress, completed_at")
      .eq("user_id", user.id)
      .eq("mission_id", m.id)
      .maybeSingle();
    if (existing?.completed_at) continue; // already done — don't reset

    const next = (existing?.progress ?? 0) + delta;
    const completed = next >= m.goal_target;
    await service
      .from("user_mission_progress")
      .upsert(
        {
          user_id: user.id,
          mission_id: m.id,
          progress: next,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,mission_id" },
      );
  }
}
