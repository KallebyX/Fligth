"use server";

import { createClient } from "@/lib/supabase/server";

export type DiscoverUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  current_league: string;
  mascot_outfit: string;
  profile_color: string;
  is_following: boolean;
  follows_you: boolean;
};

export type SearchResult =
  | { ok: true; users: DiscoverUser[] }
  | { ok: false; error: string };

// Search users by username/display_name. Limited and prefix-friendly.
// Hard-cap the query length so an oversized input can't full-table-scan
// the profiles table (Postgres `ilike` with no index on `%query%` would
// sequential-scan; an unbounded query string is a cheap DoS vector).
export async function searchUsers(query: string): Promise<SearchResult> {
  const q = query.trim().slice(0, 100);
  if (!q || q.length < 2) return { ok: true, users: [] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const ilike = `%${q.toLowerCase()}%`;
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, current_league, mascot_outfit, profile_color, profile_public",
    )
    .or(`username.ilike.${ilike},display_name.ilike.${ilike}`)
    .eq("profile_public", true)
    .neq("id", user.id)
    .not("username", "is", null)
    .limit(20);
  if (error) return { ok: false, error: error.message };

  return { ok: true, users: await annotateFollow(supabase, user.id, profiles ?? []) };
}

// Users you don't follow yet, in the same league. Fallback: latest active users.
export async function suggestedUsers(): Promise<SearchResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: me } = await supabase
    .from("profiles")
    .select("current_league")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("profiles")
    .select(
      "id, username, display_name, current_league, mascot_outfit, profile_color, profile_public",
    )
    .eq("profile_public", true)
    .neq("id", user.id)
    .not("username", "is", null)
    .limit(20);
  if (me?.current_league) {
    query = query.eq("current_league", me.current_league);
  }
  const { data: profiles, error } = await query;
  if (error) return { ok: false, error: error.message };

  return { ok: true, users: await annotateFollow(supabase, user.id, profiles ?? []) };
}

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  current_league: string;
  mascot_outfit: string;
  profile_color: string;
};

type SBClient = Awaited<ReturnType<typeof createClient>>;

async function annotateFollow(
  supabase: SBClient,
  myId: string,
  rows: ProfileRow[],
): Promise<DiscoverUser[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: following }, { data: followers }] = await Promise.all([
    supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", myId)
      .in("followed_id", ids),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("followed_id", myId)
      .in("follower_id", ids),
  ]);
  const fSet = new Set((following ?? []).map((r) => r.followed_id));
  const bSet = new Set((followers ?? []).map((r) => r.follower_id));
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    display_name: r.display_name,
    current_league: r.current_league,
    mascot_outfit: r.mascot_outfit,
    profile_color: r.profile_color,
    is_following: fSet.has(r.id),
    follows_you: bSet.has(r.id),
  }));
}
