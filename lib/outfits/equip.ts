import { createClient } from "@/lib/supabase/server";

export type EquipResult =
  | { ok: true; equipped: string }
  | { ok: false; error: string };

// Sets `profiles.equipped_outfit_slug` to `slug` if the user owns it.
export async function equipOutfitFor(slug: string): Promise<EquipResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: owned } = await supabase
    .from("user_outfits")
    .select("outfit_slug")
    .eq("user_id", user.id)
    .eq("outfit_slug", slug)
    .maybeSingle();
  if (!owned) return { ok: false, error: "not_owned" };

  const { error } = await supabase
    .from("profiles")
    .update({ equipped_outfit_slug: slug })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true, equipped: slug };
}
