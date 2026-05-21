"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Accept all three locale phrasings so the i18n migration of the confirm
// dialog (B7) doesn't break server validation. Match is case-insensitive
// and trims surrounding whitespace defensively.
const CONFIRM_PHRASES = [
  "EXCLUIR MINHA CONTA",
  "DELETE MY ACCOUNT",
  "ELIMINAR MI CUENTA",
];

const DELETION_DELAY_HOURS = 24;

export type RequestDeletionResult =
  | { ok: true; executesAt: string }
  | { ok: false; error: string };

// Step 1 — schedule a deletion 24h out. We do NOT call admin.deleteUser
// here. Cron `process_account_deletion_queue` (every 15min) handles the
// actual cascade once the window expires.
//
// LGPD/Apple Guideline 5.1.1(v): account deletion must be reachable from
// within the app. The 24h delay is well within both bodies' expectations
// (Apple says "you may take up to 30 days"); the upside is users who
// click destructive buttons in a panic can recover.
export async function requestDeletion(input: {
  confirmText: string;
}): Promise<RequestDeletionResult> {
  const normalized = input.confirmText.trim().toUpperCase();
  if (!CONFIRM_PHRASES.includes(normalized)) {
    return { ok: false, error: "confirm_text_mismatch" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const now = new Date();
  const executesAt = new Date(now.getTime() + DELETION_DELAY_HOURS * 3600_000);

  const { error } = await supabase
    .from("profiles")
    .update({
      deletion_requested_at: now.toISOString(),
      deletion_executes_at: executesAt.toISOString(),
    })
    .eq("id", user.id);
  if (error) {
    Sentry.captureException(error, { tags: { action: "request_deletion" } });
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true, executesAt: executesAt.toISOString() };
}

export type CancelDeletionResult =
  | { ok: true }
  | { ok: false; error: string };

// Step 2 — undo a pending deletion. Reachable via PendingDeletionBanner
// on /profile any time before the 24h window closes.
export async function cancelDeletion(): Promise<CancelDeletionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      deletion_requested_at: null,
      deletion_executes_at: null,
    })
    .eq("id", user.id);
  if (error) {
    Sentry.captureException(error, { tags: { action: "cancel_deletion" } });
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  return { ok: true };
}

// Back-compat alias: the old single-step `deleteAccount` action is gone,
// but the DeleteAccountDialog still imports a function by that name. Map
// it to the new request flow. Returns `executesAt` so the dialog can show
// the new countdown instead of redirecting to /?deleted=1.
export type DeleteAccountResult = RequestDeletionResult;
export async function deleteAccount(input: {
  confirmText: string;
}): Promise<DeleteAccountResult> {
  return requestDeletion(input);
}

// Admin-only escape hatch: nuke immediately. Used by:
//   1. Test fixtures that need to recycle accounts.
//   2. Trust & safety when banning abusers.
// NOT exposed to end users.
export async function forceDeleteAccountAdmin(input: {
  targetUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Admin check via profiles.role (same pattern as moderateGalleryPost).
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { ok: false, error: "forbidden" };

  const service = createServiceClient();
  try {
    const { error } = await service.auth.admin.deleteUser(input.targetUserId);
    if (error) {
      Sentry.captureException(error, { tags: { action: "force_delete_admin" } });
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "force_delete_admin" } });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "delete_failed",
    };
  }
}
