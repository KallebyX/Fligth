// Append-only event log for the social feed.
// Inserts always use service_role (RLS disallows direct INSERT to keep the
// stream trustworthy). Read paths go through user_activities RLS or the
// public_activities_v view.

import type { Json } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";

export type ActivityKind =
  | "lesson_completed"
  | "badge_earned"
  | "league_promoted"
  | "exam_passed"
  | "streak_milestone"
  | "outfit_unlocked"
  | "jackpot_win";

export async function recordActivity(
  userId: string,
  kind: ActivityKind,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const service = createServiceClient();
    await service.from("user_activities").insert({
      user_id: userId,
      kind,
      payload: payload as Json,
    });
  } catch {
    // Activity logging is best-effort: never let it break the parent flow.
  }
}

// Streak milestones that produce a "streak_milestone" entry. Mirrors the
// values exposed to the public Discover view (>= 30 are surfaced publicly).
export const STREAK_MILESTONES = new Set([3, 7, 14, 30, 100, 365]);
