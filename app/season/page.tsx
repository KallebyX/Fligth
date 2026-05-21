import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles, Trophy, Clock } from "lucide-react";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { AppShell } from "@/components/nav/AppShell";
import { HUD } from "@/components/hud/HUD";
import { createClient } from "@/lib/supabase/server";
import { computeHearts } from "@/lib/hearts";
import { computeProStatus } from "@/lib/pro";
import { getCurrentSeason } from "@/app/actions/seasons";
import { MissionRow } from "@/components/season/MissionRow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Temporada",
  description:
    "Missões da temporada atual no Comandante Lorí — complete desafios e ganhe gems, XP e outfits exclusivos.",
};

function formatRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Encerrada";
  const days = Math.floor(diff / (24 * 3600 * 1000));
  const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
  if (days > 0) return `${days}d ${hours}h restantes`;
  return `${hours}h restantes`;
}

export default async function SeasonPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/season");

  const [{ data: stats }, season] = await Promise.all([
    supabase
      .from("user_stats")
      .select(
        "total_xp, current_streak, hearts, hearts_regen_at, gems, streak_freezes, hearts_unlimited_until, pro_until, pro_plan",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    getCurrentSeason(),
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

      <main className="container max-w-2xl space-y-5 py-6">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink dark:text-cloud/60 dark:hover:text-cloud"
        >
          <ChevronLeft size={16} />
          Voltar
        </Link>

        {!season ? (
          <Card className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amethyst/15 text-amethyst-deep">
              <Sparkles size={26} />
            </div>
            <CardTitle>Nenhuma temporada ativa</CardTitle>
            <CardDesc className="mt-2">
              Volte em breve — a próxima temporada já está sendo preparada
              com missões novas e recompensas exclusivas.
            </CardDesc>
          </Card>
        ) : (
          <>
            {/* Hero card */}
            <section
              className="relative isolate overflow-hidden rounded-3xl p-6 text-white shadow-pop"
              style={{
                background: `linear-gradient(135deg, ${season.color}cc, ${season.color}66)`,
              }}
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15"
                aria-hidden
              />
              <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                <Trophy size={11} />
                Temporada {season.slug.replace(/^s/, "")}
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">
                {season.name}
              </h1>
              {season.theme && (
                <p className="mt-1 text-sm opacity-95">{season.theme}</p>
              )}
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
                <Clock size={14} />
                {formatRemaining(season.ends_at)}
              </p>
            </section>

            {/* Mission list, grouped by tier */}
            {[1, 2, 3].map((tier) => {
              const tierMissions = season.missions.filter((m) => m.tier === tier);
              if (tierMissions.length === 0) return null;
              const tierName =
                tier === 1 ? "Iniciante" : tier === 2 ? "Intermediário" : "Lendário";
              return (
                <section key={tier} className="space-y-2">
                  <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-ink/55 dark:text-cloud/55">
                    {tierName} · Tier {tier}
                  </h2>
                  <div className="space-y-2">
                    {tierMissions.map((m) => (
                      <MissionRow key={m.id} mission={m} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>
    </AppShell>
  );
}
