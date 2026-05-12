"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type FeedKind =
  | "lesson_completed"
  | "badge_earned"
  | "league_promoted"
  | "exam_passed"
  | "streak_milestone"
  | "outfit_unlocked"
  | "jackpot_win";

export type FeedItem = {
  id: number;
  kind: FeedKind;
  payload: Record<string, unknown>;
  created_at: string;
  user: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_color: string;
    mascot_outfit: string;
    current_league: string;
  };
};

export type FeedResult =
  | { ok: true; items: FeedItem[]; nextCursor: string | null }
  | { ok: false; error: string };

const PAGE = 20;

// Activities from users the viewer follows. RLS allows the select via
// the "uacts: read followed" policy.
export async function getFollowingFeed(cursor: string | null): Promise<FeedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: followingRows } = await supabase
    .from("follows")
    .select("followed_id")
    .eq("follower_id", user.id);
  const ids = (followingRows ?? []).map((r) => r.followed_id);
  if (ids.length === 0) {
    return { ok: true, items: [], nextCursor: null };
  }

  let q = supabase
    .from("user_activities")
    .select("id, kind, payload, created_at, user_id")
    .in("user_id", ids)
    .order("created_at", { ascending: false })
    .limit(PAGE + 1);
  if (cursor) q = q.lt("created_at", cursor);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };

  return hydrate(data ?? []);
}

// Public Discover feed. Reads the filtered view that already excludes
// private profiles and low-signal kinds.
export async function getDiscoverFeed(cursor: string | null): Promise<FeedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  let q = supabase
    .from("public_activities_v")
    .select("id, kind, payload, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(PAGE + 1);
  if (cursor) q = q.lt("created_at", cursor);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };

  return hydrate(data ?? []);
}

type RawRow = {
  id: number;
  kind: string;
  payload: Json | null;
  created_at: string;
  user_id: string;
};

async function hydrate(rows: RawRow[]): Promise<FeedResult> {
  if (rows.length === 0) {
    return { ok: true, items: [], nextCursor: null };
  }
  const supabase = await createClient();
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter((x): x is string => !!x)));

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, profile_color, mascot_outfit, current_league",
    )
    .in("id", userIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const hasMore = rows.length > PAGE;
  const page = rows.slice(0, PAGE);
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  const items: FeedItem[] = page
    .map((r) => {
      const u = byId.get(r.user_id);
      if (!u) return null;
      return {
        id: r.id,
        kind: r.kind as FeedKind,
        payload: (r.payload as Record<string, unknown> | null) ?? {},
        created_at: r.created_at,
        user: {
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          profile_color: u.profile_color,
          mascot_outfit: u.mascot_outfit,
          current_league: u.current_league,
        },
      } satisfies FeedItem;
    })
    .filter((x): x is FeedItem => x !== null);

  return { ok: true, items, nextCursor };
}
