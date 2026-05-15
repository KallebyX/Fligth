import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeProStatus } from "@/lib/pro";
import { ManageActions } from "@/components/pro/ManageActions";
import { Crown, Calendar, RotateCcw, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = {
  monthly: "Plano Mensal",
  yearly: "Plano Anual",
  lifetime: "Vitalício",
  trial: "Período de teste",
};

function formatBR(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function ProManagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pro/manage");

  const [{ data: stats }, { data: sub }] = await Promise.all([
    supabase
      .from("user_stats")
      .select("pro_until, pro_plan")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select(
        "provider, product_sku, status, current_period_end, cancel_at, trial_end, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const proStatus = computeProStatus(
    stats?.pro_until ?? null,
    stats?.pro_plan ?? null,
  );

  if (!proStatus.isPro) {
    return (
      <main className="container max-w-2xl space-y-6 py-8">
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
        >
          ← Voltar
        </Link>
        <Card>
          <CardTitle>Você não é Pro ainda</CardTitle>
          <CardDesc>
            Assine pra ter vidas ilimitadas, simulados extras e o outfit Pro
            Dourado do Capitão Lorí.
          </CardDesc>
          <Link href="/pro" className="mt-4 inline-block">
            <Button size="md">Ver planos</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const provider = sub?.provider ?? null;
  const isLifetime = proStatus.plan === "lifetime";
  const isCanceling = !!sub?.cancel_at;
  const isTrialing = sub?.status === "trialing";
  const nextDate =
    sub?.current_period_end ?? stats?.pro_until ?? null;

  return (
    <main className="container max-w-2xl space-y-6 py-8">
      <Link
        href="/profile/edit"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        ← Voltar
      </Link>

      <Card className="border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-sun/5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gold/20 p-2 text-gold">
            <Crown size={22} />
          </div>
          <div>
            <CardTitle className="mb-0">
              {PLAN_LABEL[proStatus.plan ?? "monthly"] ?? "Pro"}
            </CardTitle>
            <CardDesc className="mt-0.5">
              {isLifetime
                ? "Acesso vitalício, sem renovação."
                : isTrialing
                  ? "Você está no período de teste grátis."
                  : isCanceling
                    ? "Cancelado — acesso até a data abaixo."
                    : "Renova automaticamente."}
            </CardDesc>
          </div>
        </div>

        {!isLifetime && (
          <div className="mt-5 space-y-2">
            <Row
              icon={<Calendar size={16} />}
              label={
                isCanceling
                  ? "Acesso até"
                  : isTrialing
                    ? "Cobrança começa em"
                    : "Próxima cobrança"
              }
              value={formatBR(nextDate)}
            />
            <Row
              icon={<CheckCircle2 size={16} />}
              label="Status"
              value={(sub?.status ?? "active").replace(/_/g, " ")}
            />
            {provider && (
              <Row
                icon={<RotateCcw size={16} />}
                label="Pago via"
                value={
                  provider === "stripe"
                    ? "Cartão (Stripe)"
                    : provider === "apple_iap"
                      ? "App Store"
                      : provider === "google_iap"
                        ? "Google Play"
                        : provider
                }
              />
            )}
          </div>
        )}

        <div className="mt-6">
          <ManageActions provider={provider} isLifetime={isLifetime} />
        </div>
      </Card>

      <p className="px-2 text-center text-xs text-ink/50">
        Pra trocar de plano ou cancelar, use o botão acima. Cancelamentos
        mantêm seu acesso até o fim do período já pago.
      </p>
    </main>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-cloud-deep/30">
      <span className="text-ink/50">{icon}</span>
      <span className="flex-1 text-xs font-bold uppercase tracking-wide text-ink/55">
        {label}
      </span>
      <span className="text-sm font-extrabold capitalize text-ink">
        {value}
      </span>
    </div>
  );
}
