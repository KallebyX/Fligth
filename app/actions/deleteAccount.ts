"use server";

import * as Sentry from "@sentry/nextjs";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

// Excluir conta — requisito da App Store (Guideline 5.1.1(v)) e LGPD/GDPR.
//
// Todas as FKs em public.* → auth.users tem ON DELETE CASCADE (conferido
// via pg_constraint), então deletar o auth.users remove em cascata:
// profiles, user_stats, user_progress, user_question_attempts, user_outfits,
// purchases, subscriptions, push_tokens, league_members, mock_exam_attempts,
// user_badges, follows, notifications, user_activities.
//
// Stripe purchases / subscriptions ficam preservadas no painel do Stripe
// para registro fiscal independente. Para também cancelar subscriptions
// ativas na Stripe na hora, daria pra adicionar uma chamada stripe.subscriptions.cancel
// antes do delete — out of scope desta v1.
export async function deleteAccount(input: {
  confirmText: string;
}): Promise<DeleteAccountResult> {
  if (input.confirmText !== "EXCLUIR MINHA CONTA") {
    return { ok: false, error: "confirm_text_mismatch" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const service = createServiceClient();

  try {
    const { error } = await service.auth.admin.deleteUser(user.id);
    if (error) {
      Sentry.captureException(error, {
        tags: { action: "delete_account" },
      });
      return { ok: false, error: error.message };
    }

    await supabase.auth.signOut();
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "delete_account" } });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "delete_failed",
    };
  }
}
