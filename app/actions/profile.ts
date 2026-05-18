"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { USERNAME_RE, isReservedUsername } from "@/lib/validators";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type UpdateProfileInput = {
  display_name?: string | null;
  bio?: string | null;
  country_code?: string | null;
  profile_color?: string;
  profile_public?: boolean;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

const COLORS = new Set([
  "sky", "grass", "sun", "alert", "gold", "ink",
]);

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const patch: ProfileUpdate = {};

  if (input.display_name !== undefined) {
    const v = (input.display_name ?? "").trim();
    if (v.length > 40) return { ok: false, error: "display_name_too_long" };
    patch.display_name = v || null;
  }
  if (input.bio !== undefined) {
    const v = (input.bio ?? "").trim();
    if (v.length > 280) return { ok: false, error: "bio_too_long" };
    patch.bio = v || null;
  }
  if (input.country_code !== undefined) {
    const v = (input.country_code ?? "").trim().toUpperCase();
    if (v && !/^[A-Z]{2}$/.test(v))
      return { ok: false, error: "country_code_invalid" };
    patch.country_code = v || null;
  }
  if (input.profile_color !== undefined) {
    if (!COLORS.has(input.profile_color))
      return { ok: false, error: "color_invalid" };
    patch.profile_color = input.profile_color;
  }
  if (input.profile_public !== undefined) {
    patch.profile_public = Boolean(input.profile_public);
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true };
}

export async function setUsername(
  raw: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username))
    return { ok: false, error: "username_invalid_format" };
  if (isReservedUsername(username))
    return { ok: false, error: "username_reserved" };

  // Case-insensitive uniqueness check happens at DB level via the
  // partial unique index `profiles_username_lower_idx`. We rely on it.
  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);
  if (error) {
    if (/duplicate key|profiles_username_lower_idx/i.test(error.message)) {
      return { ok: false, error: "username_taken" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true };
}
