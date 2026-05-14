import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { BuyButton } from "@/components/shop/BuyButton";
import { Check, Sparkles, Heart, BarChart3, Plane, Crown } from "lucide-react";
import { computeProStatus } from "@/lib/pro";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Heart, title: "Vidas ilimitadas", body: "Erre à vontade. Aprendizado real exige errar." },
  { icon: Plane, title: "Simulados extras", body: "Banco expandido + simulados por matéria isolada." },
  { icon: BarChart3, title: "Estatísticas avançadas", body: "Acertos por tópico, evolução semanal, pontos fracos." },
  { icon: Sparkles, title: "Sem anúncios", body: "Estudo limpo, foco total." },
  { icon: Crown, title: "Suporte prioritário", body: "Resposta em até 24h direto da equipe." },
  { icon: Check, title: "Cancele quando quiser", body: "Sem fidelidade. Pode cancelar 1-clique no app." },
];

export default async function ProPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pro");

  const params = await searchParams;
  const service = createServiceClient();

  const [{ data: stats }, { data: products }] = await Promise.all([
    supabase.from("user_stats").select("pro_until, pro_plan").eq("user_id", user.id).single(),
    service
      .from("products")
      .select("id, sku, name, description, kind, price_cents, currency, order_index, payload")
      .eq("kind", "pro_subscription")
      .or("kind.eq.pro_lifetime")
      .eq("active", true)
      .order("order_index"),
  ]);

  // The .or() above doesn't compose with .eq() the way I want; redo with in().
  const { data: proProducts } = await service
    .from("products")
    .select("id, sku, name, description, kind, price_cents, currency, order_index, payload")
    .in("kind", ["pro_subscription", "pro_lifetime"])
    .eq("active", true)
    .order("order_index");

  const list = proProducts ?? products ?? [];

  const proStatus = computeProStatus(stats?.pro_until ?? null, stats?.pro_plan ?? null);

  return (
    <main className="container max-w-3xl space-y-8 py-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        ← Voltar
      </Link>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold to-sun text-white shadow-pop">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-white/10"
        />
        <div className="relative grid items-center gap-3 px-5 py-7 text-center sm:grid-cols-[auto,1fr] sm:text-left">
          <div className="flex justify-center">
            <div className="rounded-full bg-white/20 p-2 ring-4 ring-white/30">
              <Mascot state="celebrate" size={132} outfit="pro-gold" />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              <Crown size={12} />
              Capitão Lorí Pro
            </span>
            <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
              Aprovação séria,
              <br />
              sem fricção.
            </h1>
            <p className="mt-2 text-sm leading-snug opacity-95">
              Vidas ilimitadas, simulados extras e o outfit Pro Dourado pro
              Capitão Lorí.
            </p>
            {proStatus.isPro && (
              <p className="mt-3 inline-block rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-grass-deep">
                ✓ Você já é Pro{" "}
                {proStatus.plan === "lifetime" ? "vitalício" : `(${proStatus.plan})`}
              </p>
            )}
          </div>
        </div>
      </section>

      {params.canceled && (
        <div className="rounded-2xl border-2 border-cloud-deep bg-cloud p-3 text-sm text-ink/70">
          Compra cancelada — sem cobrança.
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="card-pop flex items-start gap-3 p-4">
            <div className="rounded-2xl bg-gold/15 p-2 text-gold">
              <f.icon size={22} />
            </div>
            <div>
              <p className="text-sm font-extrabold">{f.title}</p>
              <p className="text-xs text-ink/70">{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {list.map((p) => {
          const isLifetime = p.kind === "pro_lifetime";
          const interval = (p.payload as { interval?: string })?.interval;
          const trialDays = (p.payload as { trial_days?: number })?.trial_days ?? 0;
          const price = (p.price_cents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: p.currency.toUpperCase(),
          });
          const isFeatured = p.sku === "pro_yearly";

          return (
            <Card
              key={p.id}
              className={
                isFeatured
                  ? "relative border-2 border-sky bg-sky/5 p-6"
                  : "relative p-6"
              }
            >
              {isFeatured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-lg font-black">{p.name}</h3>
              <p className="mt-1 min-h-[40px] text-xs text-ink/70">{p.description}</p>

              <div className="mt-4">
                <span className="text-3xl font-black">{price}</span>
                {!isLifetime && (
                  <span className="ml-1 text-sm text-ink/60">
                    /{interval === "year" ? "ano" : "mês"}
                  </span>
                )}
              </div>

              {trialDays > 0 && !isLifetime && (
                <p className="mt-1 text-xs font-bold text-grass">
                  {trialDays} dias grátis · cobrança automática depois
                </p>
              )}

              <div className="mt-5">
                {proStatus.isPro && !isLifetime ? (
                  <Button size="md" variant="outline" className="w-full" disabled>
                    Você já assina
                  </Button>
                ) : proStatus.plan === "lifetime" ? (
                  <Button size="md" variant="outline" className="w-full" disabled>
                    Você tem vitalício
                  </Button>
                ) : (
                  <BuyButton sku={p.sku} />
                )}
              </div>
            </Card>
          );
        })}
      </section>

      <p className="pt-2 text-center text-xs text-ink/50">
        Aceita cartão, Apple Pay, Google Pay e PIX. Cancele a qualquer momento —
        você mantém o acesso até o fim do período pago. Reembolso integral em
        até 7 dias.
      </p>
    </main>
  );
}
