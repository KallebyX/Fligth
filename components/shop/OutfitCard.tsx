"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gem, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { purchaseOutfitWithGems, equipOutfit } from "@/app/actions/outfits";
import { impact, notify } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type ShopOutfit = {
  slug: string;
  name: string;
  description: string | null;
  tier: "free" | "prize" | "paid";
  rarity: "common" | "rare" | "epic" | "legendary";
  price_gems: number | null;
  price_cents: number | null;
  asset_key: string;
};

const RARITY_RING: Record<ShopOutfit["rarity"], string> = {
  common: "ring-cloud-deep",
  rare: "ring-sky",
  epic: "ring-[#9333EA]",
  legendary: "ring-gold",
};

const RARITY_LABEL: Record<ShopOutfit["rarity"], string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export function OutfitCard({
  outfit,
  owned,
  equipped,
  userGems,
}: {
  outfit: ShopOutfit;
  owned: boolean;
  equipped: boolean;
  userGems: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canBuyGems = outfit.price_gems != null && outfit.price_gems > 0;
  const canAfford = outfit.price_gems != null && userGems >= outfit.price_gems;

  function buyGems() {
    if (!canBuyGems || pending) return;
    setError(null);
    void impact("medium");
    start(async () => {
      const res = await purchaseOutfitWithGems(outfit.slug);
      if (!res.ok) {
        void notify("error");
        setError(
          res.error === "not_enough_gems"
            ? "Você não tem gems suficientes."
            : res.error === "already_owned"
              ? "Você já tem esse outfit."
              : "Não foi possível comprar agora.",
        );
        return;
      }
      void notify("success");
      router.refresh();
    });
  }

  function equip() {
    if (pending) return;
    void impact("light");
    start(async () => {
      const res = await equipOutfit(outfit.slug);
      if (!res.ok) {
        void notify("error");
        return;
      }
      void notify("success");
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "card-pop relative p-3 text-center",
        equipped && "ring-2 ring-offset-2",
        equipped && RARITY_RING[outfit.rarity],
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-cloud/60",
          !owned && "grayscale",
        )}
      >
        <Mascot state="happy" size={96} outfit={outfit.slug} />
      </div>
      <p className="mt-2 text-sm font-extrabold text-ink">{outfit.name}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
        {RARITY_LABEL[outfit.rarity]}
      </p>
      {outfit.description && (
        <p className="mt-1 line-clamp-2 text-[11px] text-ink/60">
          {outfit.description}
        </p>
      )}

      <div className="mt-3 space-y-1">
        {equipped ? (
          <Button variant="outline" size="sm" disabled className="w-full">
            <Check size={14} />
            Equipado
          </Button>
        ) : owned ? (
          <Button
            size="sm"
            className="w-full"
            onClick={equip}
            disabled={pending}
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : "Equipar"}
          </Button>
        ) : canBuyGems ? (
          <Button
            size="sm"
            variant={canAfford ? "primary" : "outline"}
            disabled={!canAfford || pending}
            className="w-full"
            onClick={buyGems}
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <Gem size={14} />
                {outfit.price_gems}
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled className="w-full">
            <Lock size={14} />
            Exclusivo
          </Button>
        )}
      </div>
      {error && <p className="mt-1 text-[10px] font-bold text-alert">{error}</p>}
    </div>
  );
}
