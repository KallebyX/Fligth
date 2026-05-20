import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Gift, Sparkles } from "lucide-react";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { AppShell } from "@/components/nav/AppShell";
import { HUD } from "@/components/hud/HUD";
import { createClient } from "@/lib/supabase/server";
import { computeHearts } from "@/lib/hearts";
import { computeProStatus } from "@/lib/pro";
import { getReferralStatus } from "@/app/actions/referrals";
import { InviteShare } from "@/components/invite/InviteShare";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Indique amigos",
  description:
    "Cada amigo que assinar pelo seu link te dá 1 mês de Pro grátis. Sem limite, sem pegadinha.",
};

export default async function InvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/invite");

  const [{ data: stats }, status] = await Promise.all([
    supabase
      .from("user_stats")
      .select(
        "total_xp, current_streak, hearts, hearts_regen_at, gems, streak_freezes, hearts_unlimited_until, pro_until, pro_plan",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    getReferralStatus(),
  ]);

  const hearts = computeHearts({
    hearts: stats?.hearts ?? 5,
    hearts_regen_at: stats?.hearts_regen_at ?? null,
  });
  const pro = computeProStatus(stats?.pro_until ?? null, stats?.pro_plan ?? null);

  return (
    <AppShell>
      <HUD
        xp={stats?.total_xp ?? 0}
        streak={stats?.current_streak ?? 0}
        hearts={hearts.hearts}
        gems={stats?.gems ?? 0}
        isPro={pro.isPro}
        freezes={stats?.streak_freezes ?? 0}
      />

      <main className="container max-w-xl space-y-5 py-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink dark:text-cloud/60 dark:hover:text-cloud"
        >
          <ChevronLeft size={16} />
          Voltar
        </Link>

        <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-sky to-grass p-6 text-white shadow-pop">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15"
            aria-hidden
          />
          <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            <Gift size={11} />
            Programa de indicação
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">
            Ganhe 1 mês de Pro grátis
          </h1>
          <p className="mt-2 text-sm opacity-95">
            Cada amigo que entrar pelo seu link e completar 3 lições te dá
            <strong> 30 dias de Pro</strong>. Sem limite — quanto mais você
            indica, mais voa de graça.
          </p>
        </section>

        {!status ? (
          <Card className="text-center">
            <CardTitle>Não foi possível gerar seu link agora</CardTitle>
            <CardDesc className="mt-2">Tente recarregar a página.</CardDesc>
          </Card>
        ) : (
          <>
            <InviteShare code={status.code} url={status.inviteUrl} />

            <Card>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={18} className="text-gold" />
                Seu placar
              </CardTitle>
              <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-sky/10 p-3 dark:bg-sky/15">
                  <p className="text-3xl font-black text-sky">
                    {status.totalCredited}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/60 dark:text-cloud/60">
                    Amigos creditados
                  </p>
                </div>
                <div className="rounded-2xl bg-gold/10 p-3 dark:bg-gold/15">
                  <p className="text-3xl font-black text-gold">
                    {status.daysGranted}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/60 dark:text-cloud/60">
                    Dias Pro ganhos
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardTitle>Como funciona</CardTitle>
              <ol className="mt-3 space-y-2 text-sm leading-snug text-ink/75 dark:text-cloud/75">
                <li>
                  <strong>1.</strong> Compartilhe seu link com amigos pilotos.
                </li>
                <li>
                  <strong>2.</strong> Ao se cadastrar pelo link, o amigo
                  começa em uma trilha personalizada.
                </li>
                <li>
                  <strong>3.</strong> Quando ele completar 3 lições, você
                  ganha automaticamente <strong>30 dias de Pro</strong>.
                </li>
              </ol>
            </Card>
          </>
        )}
      </main>
    </AppShell>
  );
}
