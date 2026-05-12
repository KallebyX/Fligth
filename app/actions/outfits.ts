"use server";

import { revalidatePath } from "next/cache";
import { equipOutfitFor, type EquipResult } from "@/lib/outfits/equip";

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
