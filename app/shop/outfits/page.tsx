import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { RoulettePanel } from "@/components/shop/RoulettePanel";
import { JackpotPanel } from "@/components/shop/JackpotPanel";
import { OutfitCard, type ShopOutfit } from "@/components/shop/OutfitCard";
import { createClient } from "@/lib/supabase/server";
import { loadOutfits } from "@/lib/outfits/catalog";
import { rouletteAvailableAt } from "@/lib/outfits/roulette";
import { jackpotAvailableAt } from "@/lib/outfits/jackpot";
import { ChevronLeft, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OutfitShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/shop/outfits");

  const [{ data: stats }, { data: profile }, { data: owned }, catalog] =
    await Promise.all([
      supabase
        .from("user_stats")
        .select("gems, last_spin_at, last_jackpot_at")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("equipped_outfit_slug")
        .eq("id", user.id)
        .single(),
      supabase.from("user_outfits").select("outfit_slug").eq("user_id", user.id),
      loadOutfits(),
    ]);

  const ownedSet = new Set((owned ?? []).map((o) => o.outfit_slug));
  const equipped = profile?.equipped_outfit_slug ?? null;
  const gems = stats?.gems ?? 0;

  const rouletteState = rouletteAvailableAt(stats?.last_spin_at ?? null);
  const jackpotState = jackpotAvailableAt(stats?.last_jackpot_at ?? null);

  const sorted = catalog.slice().sort((a, b) => {
    const tierOrder = { paid: 0, prize: 1, free: 2 } as const;
    if (tierOrder[a.tier] !== tierOrder[b.tier])
      return tierOrder[a.tier] - tierOrder[b.tier];
    const rarity = { legendary: 0, epic: 1, rare: 2, common: 3 } as const;
    return rarity[a.rarity] - rarity[b.rarity];
  });

  const buyable: ShopOutfit[] = sorted
    .filter((o) => !ownedSet.has(o.slug) && o.price_gems != null && o.price_gems > 0)
    .map(toShopOutfit);

  const wardrobe = sorted
    .filter((o) => ownedSet.has(o.slug))
    .map(toShopOutfit);

  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={16} />
        Voltar à loja
      </Link>

      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black">
          <Sparkles size={28} className="text-sky" />
          Outfits do Capitão
        </h1>
        <p className="text-sm text-ink/60">
          Ganhe na roleta diária, aposte no jackpot ou compre direto com gems.
        </p>
      </header>

      <section className="space-y-4">
        <RoulettePanel initialNextSpinAt={rouletteState.nextAt} />
        <JackpotPanel initialGems={gems} initialNextAt={jackpotState.nextAt} />
      </section>

      <Card>
        <CardTitle>Comprar com gems</CardTitle>
        <CardDesc>Outfits liberados para compra direta — sem RNG.</CardDesc>
        {buyable.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">
            Nada na vitrine no momento — gire a roleta!
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {buyable.map((o) => (
              <OutfitCard
                key={o.slug}
                outfit={o}
                owned={ownedSet.has(o.slug)}
                equipped={equipped === o.slug}
                userGems={gems}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Seu armário</CardTitle>
        <CardDesc>
          {ownedSet.size} outfit{ownedSet.size === 1 ? "" : "s"} no inventário.
        </CardDesc>
        {wardrobe.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">
            Comece pela roleta diária para ganhar seu primeiro outfit.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {wardrobe.map((o) => (
              <OutfitCard
                key={o.slug}
                outfit={o}
                owned
                equipped={equipped === o.slug}
                userGems={gems}
              />
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}

function toShopOutfit(o: Awaited<ReturnType<typeof loadOutfits>>[number]): ShopOutfit {
  return {
    slug: o.slug,
    name: o.name,
    description: o.description,
    tier: o.tier,
    rarity: o.rarity,
    price_gems: o.price_gems,
    price_cents: o.price_cents,
    asset_key: o.asset_key,
  };
}
