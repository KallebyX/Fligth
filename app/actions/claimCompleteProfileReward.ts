"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateCompletion } from "@/lib/profileCompletion";

const REWARD_GEMS = 50;

export type ClaimResult =
  | { ok: true; gems: number; total: number }
  | { ok: false; error: string };

export async function claimCompleteProfileReward(): Promise<ClaimResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username, display_name, bio, country_code, avatar_url, equipped_outfit_slug",
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_stats")
      .select("gems, profile_completed_at")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile || !stats) return { ok: false, error: "no_profile" };

  if (stats.profile_completed_at) {
    return { ok: false, error: "already_claimed" };
  }

  const { pct } = calculateCompletion({
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    country_code: profile.country_code,
    avatar_url: profile.avatar_url,
    equipped_outfit_slug: profile.equipped_outfit_slug,
  });

  if (pct < 100) {
    return { ok: false, error: "not_complete" };
  }

  const newGems = (stats.gems ?? 0) + REWARD_GEMS;
  const { error } = await supabase
    .from("user_stats")
    .update({
      gems: newGems,
      profile_completed_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile/edit");
  revalidatePath("/profile");
  return { ok: true, gems: REWARD_GEMS, total: newGems };
}
