"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GalleryUploadInput = {
  imagePath: string;         // storage path under gallery/{user_id}/...
  thumbnailPath: string;
  caption?: string | null;
  aircraftModel?: string | null;
  location?: string | null;
  takenAt?: string | null;   // ISO timestamp
};

export type GalleryUploadResult =
  | { ok: true; postId: string }
  | { ok: false; error: string };

const BUCKET = "gallery";

function publicUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function createGalleryPost(
  input: GalleryUploadInput,
): Promise<GalleryUploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Rate-limit: 3 uploads per rolling 24h. Inlined rather than calling the
  // gallery_can_upload RPC so we don't have to regenerate types.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("gallery_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", dayAgo);
  if ((recentCount ?? 0) >= 3) {
    return { ok: false, error: "rate_limited" };
  }

  const caption = input.caption?.trim() || null;
  if (caption && caption.length > 280) {
    return { ok: false, error: "caption_too_long" };
  }

  const imageUrl = publicUrl(supabase, input.imagePath);
  const thumbnailUrl = publicUrl(supabase, input.thumbnailPath);

  const { data: post, error } = await supabase
    .from("gallery_posts")
    .insert({
      user_id: user.id,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      caption,
      aircraft_model: input.aircraftModel?.trim() || null,
      location: input.location?.trim() || null,
      taken_at: input.takenAt ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !post) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }

  revalidatePath("/galeria");
  revalidatePath("/galeria/meus");
  return { ok: true, postId: post.id };
}

export type ToggleLikeResult =
  | { ok: true; liked: boolean; likesCount: number }
  | { ok: false; error: string };

export async function toggleGalleryLike(
  postId: string,
): Promise<ToggleLikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Check existing like.
  const { data: existing } = await supabase
    .from("gallery_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("gallery_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("gallery_likes")
      .insert({ user_id: user.id, post_id: postId });
    if (error) return { ok: false, error: error.message };
  }

  const { data: post } = await supabase
    .from("gallery_posts")
    .select("likes_count")
    .eq("id", postId)
    .single();

  revalidatePath("/galeria");
  return {
    ok: true,
    liked: !existing,
    likesCount: post?.likes_count ?? 0,
  };
}

export type CommentInput = { postId: string; body: string };
export type CommentResult =
  | { ok: true; commentId: string }
  | { ok: false; error: string };

export async function createGalleryComment(
  input: CommentInput,
): Promise<CommentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const body = input.body.trim();
  if (body.length < 1 || body.length > 500) {
    return { ok: false, error: "invalid_length" };
  }

  const { data, error } = await supabase
    .from("gallery_comments")
    .insert({ user_id: user.id, post_id: input.postId, body })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  revalidatePath(`/galeria/${input.postId}`);
  return { ok: true, commentId: data.id };
}

export type ReportInput = {
  postId: string;
  reason: "inappropriate" | "spam" | "irrelevant" | "other";
  details?: string;
};

export async function reportGalleryPost(
  input: ReportInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase.from("gallery_reports").insert({
    post_id: input.postId,
    reporter_id: user.id,
    reason: input.reason,
    details: input.details?.trim() || null,
  });
  if (error) {
    // Treat duplicate as success.
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export type ModerationInput = {
  postId: string;
  decision: "approve" | "reject";
  rejectionReason?: string;
};

export async function moderateGalleryPost(
  input: ModerationInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // RLS will block non-admins; double-check here for clearer errors.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { ok: false, error: "forbidden" };

  const { error } = await supabase
    .from("gallery_posts")
    .update({
      status: input.decision === "approve" ? "approved" : "rejected",
      rejection_reason:
        input.decision === "reject" ? input.rejectionReason ?? null : null,
      moderator_id: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", input.postId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/gallery/queue");
  revalidatePath("/galeria");
  return { ok: true };
}
