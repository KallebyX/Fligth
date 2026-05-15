import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { OutfitPicker, type CatalogOutfit } from "@/components/mascot/OutfitPicker";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { loadOutfits } from "@/lib/outfits/catalog";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: owned }, catalog] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username, display_name, bio, country_code, profile_color, profile_public, equipped_outfit_slug",
      )
      .eq("id", user.id)
      .single(),
    supabase.from("user_outfits").select("outfit_slug").eq("user_id", user.id),
    loadOutfits(),
  ]);

  const ownedSet = new Set((owned ?? []).map((o) => o.outfit_slug));
  const items: CatalogOutfit[] = catalog
    .slice()
    .sort((a, b) => {
      const order = { free: 0, prize: 1, paid: 2 } as const;
      if (order[a.tier] !== order[b.tier]) return order[a.tier] - order[b.tier];
      const rarity = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
      return rarity[a.rarity] - rarity[b.rarity];
    })
    .map((o) => ({
      slug: o.slug,
      name: o.name,
      tier: o.tier,
      rarity: o.rarity,
      asset_key: o.asset_key,
      owned: ownedSet.has(o.slug),
    }));

  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={16} />
        Voltar
      </Link>

      <header>
        <h1 className="text-3xl font-black">Editar perfil</h1>
        <p className="text-sm text-ink/60">
          Personalize como o mundo vê o piloto.
        </p>
      </header>

      <Card>
        <CardTitle>Outfit do Capitão Lorí</CardTitle>
        <CardDesc>
          O outfit equipado aparece em todo lugar onde seu mascote é mostrado.
        </CardDesc>
        <div className="mt-3">
          <OutfitPicker outfits={items} equipped={profile?.equipped_outfit_slug ?? null} />
        </div>
      </Card>

      <EditProfileForm
        initial={{
          username: profile?.username ?? null,
          display_name: profile?.display_name ?? null,
          bio: profile?.bio ?? null,
          country_code: profile?.country_code ?? null,
          profile_color: profile?.profile_color ?? "sky",
          profile_public: profile?.profile_public ?? true,
        }}
      />

      <SecuritySection email={user.email ?? null} />
    </main>
  );
}
