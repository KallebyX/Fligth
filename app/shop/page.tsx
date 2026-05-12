import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Heart, Infinity as InfinityIcon, Snowflake } from "lucide-react";
import { BuyButton } from "@/components/shop/BuyButton";
import { NativeBuyNotice } from "@/components/shop/NativeBuyNotice";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const ICONS: Record<string, LucideIcon> = {
  hearts_refill: Heart,
  hearts_unlimited: InfinityIcon,
  streak_freezes: Snowflake,
  remove_ads: Heart,
  donation: Heart,
};

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

  return (
    <main className="container max-w-3xl py-8 pb-24">
      <Link
        href="/learn"
        className="text-sm font-bold text-ink/60 hover:text-ink"
      >
        ← Voltar
      </Link>
      <h1 className="mt-3 text-3xl font-black md:text-4xl">Loja</h1>
      <p className="mt-1 text-ink/70">
        Itens consumíveis pra você seguir voando. Aceita cartão, <strong>Apple Pay</strong>,{" "}
        <strong>Google Pay</strong> e PIX.
      </p>

      {params.canceled && (
        <div className="mt-4 rounded-2xl border-2 border-cloud-deep bg-cloud p-3 text-sm text-ink/70">
          Compra cancelada — sem cobrança realizada.
        </div>
      )}

      <Link
        href="/shop/outfits"
        className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-sky/15 to-grass/15 p-4 shadow-pop hover:from-sky/25 hover:to-grass/25"
      >
        <span>
          <p className="text-sm font-extrabold text-ink">Outfits do Capitão Lorí</p>
          <p className="text-xs text-ink/60">
            Roleta diária grátis · jackpot · compra com gems
          </p>
        </span>
        <span className="text-sm font-extrabold text-sky">Ir →</span>
      </Link>

      <div className="mt-6"><NativeBuyNotice /></div>

      <div className="mt-2 grid gap-4 md:grid-cols-2">
        {(products ?? []).map((p) => {
          const Icon = ICONS[p.kind] ?? Heart;
          return (
            <Card key={p.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-sky/10 p-3 text-sky">
                  <Icon size={28} />
                </div>
                <div className="flex-1">
                  <CardTitle>{p.name}</CardTitle>
                  {p.description && <CardDesc className="mt-1">{p.description}</CardDesc>}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xl font-black text-ink">
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
      </div>

      <p className="mt-8 text-center text-xs text-ink/50">
        Pagamentos processados pelo Stripe. Não armazenamos seu cartão.
        <br />
        Reembolsos seguem a Política de Reembolso (até 7 dias após a compra).
      </p>
    </main>
  );
}
