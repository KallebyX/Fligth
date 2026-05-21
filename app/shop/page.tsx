import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import {
  Heart,
  Infinity as InfinityIcon,
  Snowflake,
  HandHeart,
  ShieldOff,
  Sparkles,
  Shirt,
  ChevronLeft,
} from "lucide-react";
import { BuyButton } from "@/components/shop/BuyButton";
import { NativeBuyNotice } from "@/components/shop/NativeBuyNotice";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

// Visual mapping: icon + tinted chip per product kind.
const KIND_VISUAL: Record<string, { Icon: LucideIcon; tint: string }> = {
  hearts_refill: { Icon: Heart, tint: "bg-alert/15 text-alert" },
  hearts_unlimited: { Icon: InfinityIcon, tint: "bg-sky/15 text-sky-deep" },
  streak_freezes: { Icon: Snowflake, tint: "bg-sky/15 text-sky-deep" },
  remove_ads: { Icon: ShieldOff, tint: "bg-ink/10 text-ink" },
  donation: { Icon: HandHeart, tint: "bg-grass/15 text-grass-deep" },
};

// Hide outfit products from this legacy shop (they have a dedicated /shop/outfits route).
const SHOP_KIND_FILTER = new Set([
  "hearts_refill",
  "hearts_unlimited",
  "streak_freezes",
  "remove_ads",
  "donation",
]);

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/shop");

  const params = await searchParams;
  const service = createServiceClient();
  const { data: products } = await service
    .from("products")
    .select("id, sku, name, description, kind, price_cents, currency, order_index")
    .eq("active", true)
    .order("order_index");

  const items = (products ?? []).filter((p) => SHOP_KIND_FILTER.has(p.kind));

  return (
    <main className="container max-w-3xl space-y-6 py-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={16} />
        Voltar
      </Link>

      <header>
        <h1 className="text-3xl font-black md:text-4xl">Loja</h1>
        <p className="mt-1 text-sm text-ink/70">
          Itens consumíveis pra continuar voando. Aceita cartão,{" "}
          <strong>Apple Pay</strong>, <strong>Google Pay</strong> e PIX.
        </p>
      </header>

      {params.canceled && (
        <div className="rounded-2xl border-2 border-cloud-deep bg-cloud p-3 text-sm text-ink/70">
          Compra cancelada — sem cobrança realizada.
        </div>
      )}

      <Link
        href="/shop/outfits"
        className="relative block overflow-hidden rounded-3xl bg-gradient-to-r from-sky to-grass p-5 text-white shadow-pop transition-transform hover:-translate-y-0.5"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/30">
            <Shirt size={22} />
          </span>
          <div className="flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={11} />
              Novo
            </span>
            <p className="mt-1 text-base font-extrabold">
              Outfits do Comandante Lorí
            </p>
            <p className="text-xs opacity-90">
              Roleta diária grátis · jackpot · compra com gems
            </p>
          </div>
          <span className="text-xl font-black">→</span>
        </div>
      </Link>

      <NativeBuyNotice />

      <section className="grid gap-3 md:grid-cols-2">
        {items.map((p) => {
          const visual = KIND_VISUAL[p.kind] ?? KIND_VISUAL.hearts_refill;
          const Icon = visual.Icon;
          return (
            <Card key={p.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.tint}`}
                >
                  <Icon size={22} />
                </span>
                <div className="flex-1">
                  <CardTitle>{p.name}</CardTitle>
                  {p.description && (
                    <CardDesc className="mt-1">{p.description}</CardDesc>
                  )}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3">
                <span className="text-xl font-black tabular-nums text-ink">
                  {(p.price_cents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: p.currency.toUpperCase(),
                  })}
                </span>
                <BuyButton sku={p.sku} />
              </div>
            </Card>
          );
        })}
      </section>

      <p className="pt-2 text-center text-xs text-ink/50">
        Pagamentos processados pelo Stripe. Não armazenamos seu cartão.
        <br />
        Reembolsos seguem a Política de Reembolso (até 7 dias após a compra).
      </p>
    </main>
  );
}
