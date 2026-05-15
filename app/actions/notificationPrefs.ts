"use server";

import { createClient } from "@/lib/supabase/server";

export type NotificationPrefs = {
  push_streak: boolean;
  push_friends: boolean;
  push_leagues: boolean;
  push_promotions: boolean;
  email_product_updates: boolean;
  email_security: boolean;
};

const DEFAULTS: NotificationPrefs = {
  push_streak: true,
  push_friends: true,
  push_leagues: true,
  push_promotions: false,
  email_product_updates: false,
  email_security: true,
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULTS;

  const { data } = await supabase
    .from("notification_prefs")
    .select("push_streak, push_friends, push_leagues, push_promotions, email_product_updates, email_security")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? DEFAULTS;
}

export async function updateNotificationPrefs(
  patch: Partial<NotificationPrefs>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("notification_prefs")
    .upsert(
      {
        user_id: user.id,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
