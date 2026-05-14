"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type NotificationItem = {
  id: number;
  kind: "followed_you" | "outfit_unlocked" | "league_promoted";
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type ListResult =
  | { ok: true; items: NotificationItem[]; unread: number }
  | { ok: false; error: string };

const LIST_LIMIT = 20;

export async function listRecent(): Promise<ListResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const [{ data: rows, error }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, kind, payload, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);
  if (error) return { ok: false, error: error.message };

  const items: NotificationItem[] = (rows ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as NotificationItem["kind"],
    payload: ((r.payload as Json | null) ?? {}) as Record<string, unknown>,
    read_at: r.read_at,
    created_at: r.created_at,
  }));
  return { ok: true, items, unread: count ?? 0 };
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
  return { ok: true };
}
