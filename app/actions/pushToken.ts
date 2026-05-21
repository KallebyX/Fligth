"use server";

import { createClient } from "@/lib/supabase/server";

type Platform = "ios" | "android" | "web";

export async function registerPushToken(input: {
  token: string;
  platform: Platform;
  deviceLabel?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.token || input.token.length < 16) {
    return { ok: false, error: "invalid_token" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Upsert by unique token. If another user previously owned the token (rare:
  // device handed over), the new ownership wins.
  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        user_id: user.id,
        token: input.token,
        platform: input.platform,
        device_label: input.deviceLabel ?? null,
        last_seen_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "token" },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function revokePushToken(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("push_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("token", token);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
