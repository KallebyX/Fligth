"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FollowResult =
  | { ok: true; following: boolean }
  | { ok: false; error: string };

export async function followUser(targetId: string): Promise<FollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (user.id === targetId) return { ok: false, error: "cannot_follow_self" };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, followed_id: targetId });
  if (error && !/duplicate key/i.test(error.message)) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/profile/[username]`, "page");
  revalidatePath("/friends");
  revalidatePath("/friends/feed");
  return { ok: true, following: true };
}

export async function unfollowUser(targetId: string): Promise<FollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followed_id", targetId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/profile/[username]`, "page");
  revalidatePath("/friends");
  revalidatePath("/friends/feed");
  return { ok: true, following: false };
}
