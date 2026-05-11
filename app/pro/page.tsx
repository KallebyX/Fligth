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
    <main className="container max-w-3xl py-10 pb-24">
      <Link href="/learn" className="text-sm font-bold text-ink/60 hover:text-ink">
        ← Voltar
      </Link>

      <section className="mt-4 text-center">
        <Mascot state="celebrate" size={140} />
        <h1 className="mt-2 text-4xl font-black md:text-5xl">
          <span className="text-sky">Capitão Lorí</span> <span className="text-gold">Pro</span>
        </h1>
        <p className="mt-2 text-base text-ink/70">Aprovação séria. Sem fricção, sem vidas acabando no meio do estudo.</p>
        {proStatus.isPro && (
          <p className="mt-3 inline-block rounded-full bg-grass/15 px-4 py-1 text-sm font-extrabold text-grass-deep">
            Você já é Pro {proStatus.plan === "lifetime" ? "vitalício" : `(${proStatus.plan})`}.
          </p>
        )}
      </section>

      {params.canceled && (
        <div className="mt-6 rounded-2xl border-2 border-cloud-deep bg-cloud p-3 text-sm text-ink/70">
          Compra cancelada — sem cobrança.
        </div>
      )}

      <section className="mt-8 grid gap-3 md:grid-cols-2">
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

      <section className="mt-10 grid gap-4 md:grid-cols-3">
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

      <p className="mt-8 text-center text-xs text-ink/50">
        Aceita cartão, Apple Pay, Google Pay e PIX. Cancele a qualquer momento — você mantém o
        acesso até o fim do período pago. Reembolso integral em até 7 dias.
      </p>
    </main>
  );
}
