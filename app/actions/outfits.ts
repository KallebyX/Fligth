"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { equipOutfitFor, type EquipResult } from "@/lib/outfits/equip";
import { spinRoulette, type SpinResult } from "@/lib/outfits/roulette";
import { spinJackpot, type JackpotResult } from "@/lib/outfits/jackpot";
import { purchaseWithGems, type PurchaseResult } from "@/lib/outfits/purchase";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function equipOutfit(slug: string): Promise<EquipResult> {
  const res = await equipOutfitFor(slug);
  if (res.ok) {
    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    revalidatePath("/leagues");
    revalidatePath(`/profile/[username]`, "page");
  }
  return res;
}

export async function spinRouletteAction(): Promise<SpinResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const res = await spinRoulette(user.id);
  if (res.ok) {
    revalidatePath("/shop");
    revalidatePath("/profile/edit");
  }
  return res;
}

export async function spinJackpotAction(): Promise<JackpotResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const res = await spinJackpot(user.id);
  if (res.ok) {
    revalidatePath("/shop");
    revalidatePath("/profile/edit");
  }
  return res;
}

export async function purchaseOutfitWithGems(
  slug: string,
): Promise<PurchaseResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const res = await purchaseWithGems(user.id, slug);
  if (res.ok) {
    revalidatePath("/shop");
    revalidatePath("/profile/edit");
  }
  return res;
}
