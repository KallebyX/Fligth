// In-app notifications. Inserts always via service_role; RLS disallows
// direct INSERT from authenticated clients so the bell drawer is trustworthy.

import type { Json } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";

export type NotificationKind =
  | "followed_you"
  | "outfit_unlocked"
  | "league_promoted";

export async function notifyUser(
  userId: string,
  kind: NotificationKind,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const service = createServiceClient();
    await service.from("notifications").insert({
      user_id: userId,
      kind,
      payload: payload as Json,
    });
  } catch {
    // Best-effort: never let notification failures break the parent flow.
  }
}
