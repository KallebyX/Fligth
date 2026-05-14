"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Gift,
  Layers,
  Loader2,
  Lock,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { equipOutfit } from "@/app/actions/outfits";
import { impact, notify } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type CatalogOutfit = {
  slug: string;
  name: string;
  tier: "free" | "prize" | "paid";
  rarity: "common" | "rare" | "epic" | "legendary";
  owned: boolean;
  asset_key: string;
};

type TabKey = "all" | "owned" | "free" | "prize" | "paid";

const RARITY_RING: Record<CatalogOutfit["rarity"], string> = {
  common: "ring-cloud-deep",
  rare: "ring-sky",
  epic: "ring-[#9333EA]",
  legendary: "ring-gold",
};

const RARITY_LABEL: Record<CatalogOutfit["rarity"], string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "owned", label: "Meus", icon: <Check size={14} /> },
  { key: "all", label: "Todos", icon: <Layers size={14} /> },
  { key: "free", label: "Grátis", icon: <Gift size={14} /> },
  { key: "prize", label: "Prêmio", icon: <Sparkles size={14} /> },
  { key: "paid", label: "Pago", icon: <ShoppingBag size={14} /> },
];

export function OutfitPicker({
  outfits,
  equipped,
}: {
  outfits: CatalogOutfit[];
  equipped: string | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<string | null>(equipped);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("owned");

  const counts = useMemo(() => {
    return {
      owned: outfits.filter((o) => o.owned).length,
      all: outfits.length,
      free: outfits.filter((o) => o.tier === "free").length,
      prize: outfits.filter((o) => o.tier === "prize").length,
      paid: outfits.filter((o) => o.tier === "paid").length,
    } as Record<TabKey, number>;
  }, [outfits]);

  const visible = useMemo(() => {
    if (tab === "owned") return outfits.filter((o) => o.owned);
    if (tab === "all") return outfits;
    return outfits.filter((o) => o.tier === tab);
  }, [outfits, tab]);

  function pick(slug: string) {
    if (slug === current || pending) return;
    void impact("light");
    setBusy(slug);
    start(async () => {
      const res = await equipOutfit(slug);
      setBusy(null);
      if (!res.ok) {
        void notify("error");
        return;
      }
      setCurrent(slug);
      void notify("success");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-colors",
                active
                  ? "border-sky bg-sky text-white"
                  : "border-cloud-deep bg-white text-ink/70 hover:bg-cloud",
              )}
            >
              {t.icon}
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  active ? "bg-white/25" : "bg-cloud text-ink/60",
                )}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="card-pop py-6 text-center">
          <p className="text-sm font-bold text-ink/60">
            Nada por aqui ainda. Bora pra loja!
          </p>
          <Link
            href="/shop/outfits"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-pop"
          >
            <ShoppingBag size={14} />
            Abrir loja
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((o) => {
            const isEquipped = current === o.slug;
            const isLocked = !o.owned;
            return (
              <button
                key={o.slug}
                type="button"
                onClick={() => (isLocked ? null : pick(o.slug))}
                disabled={isLocked || pending}
                className={cn(
                  "card-pop relative flex flex-col items-center gap-2 p-3 text-center transition-transform",
                  !isLocked && "active:scale-[0.97]",
                  isLocked && "opacity-60 cursor-default",
                  isEquipped && "ring-2 ring-offset-2",
                  isEquipped && RARITY_RING[o.rarity],
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl bg-cloud/60 p-2",
                    isLocked && "grayscale",
                  )}
                >
                  <Mascot state="idle" size={88} outfit={o.slug} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-extrabold leading-tight text-ink">
                    {o.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                    {RARITY_LABEL[o.rarity]}
                  </p>
                </div>
                {isEquipped && (
                  <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-grass text-white shadow-pop">
                    <Check size={14} />
                  </span>
                )}
                {isLocked && !isEquipped && (
                  <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-white">
                    <Lock size={14} />
                  </span>
                )}
                {busy === o.slug && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                    <Loader2 className="animate-spin" size={20} />
                  </span>
                )}
              </button>
            );
          })}

          <Link
            href="/shop/outfits"
            className="card-pop flex flex-col items-center justify-center gap-2 border-2 border-dashed border-cloud-deep p-3 text-center text-ink/70 hover:bg-cloud"
          >
            <ShoppingBag size={32} />
            <span className="text-sm font-extrabold">Ver loja</span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Roleta · Jackpot · Comprar
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
