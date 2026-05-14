import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { isoWeek } from "@/lib/utils";
import { Mascot } from "@/components/mascot/Mascot";
import { Podium, type PodiumEntry } from "@/components/leagues/Podium";
import { LeaderboardRow } from "@/components/leagues/LeaderboardRow";
import { ResetTimer } from "@/components/leagues/ResetTimer";
import { LevelUpDialog, type Promotion } from "@/components/leagues/LevelUpDialog";
import {
  DIVISIONS,
  PROMOTE_TOP,
  RELEGATE_BOTTOM,
  getDivision,
} from "@/lib/leagues/divisions";
import { Trophy, ChevronUp, ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_league")
    .eq("id", user.id)
    .single();

  const { data: recentPromo } = await supabase
    .from("user_activities")
    .select("id, payload, created_at")
    .eq("user_id", user.id)
    .eq("kind", "league_promoted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const promo: Promotion | null = recentPromo
    ? (() => {
        const p = (recentPromo.payload ?? {}) as Record<string, unknown>;
        return {
          id: recentPromo.id,
          from: (p.from as string) ?? null,
          to: (p.to as string) ?? "bronze",
          rank: (p.rank as number) ?? null,
          gems: (p.gems as number) ?? null,
          outfit:
            p.outfit && typeof p.outfit === "object"
              ? {
                  slug: (p.outfit as { slug?: string }).slug ?? "",
                  name: (p.outfit as { name?: string }).name ?? "",
                }
              : null,
        } satisfies Promotion;
      })()
    : null;

  const division = getDivision(profile?.current_league ?? "bronze");
  const week = isoWeek();

  const { data: league } = await supabase
    .from("leagues")
    .select("id")
    .eq("iso_week", week)
    .eq("division", division.slug)
    .maybeSingle();

  let board: {
    user_id: string;
    weekly_xp: number;
    username: string | null;
    display_name: string | null;
    outfit: string | null;
  }[] = [];

  if (league) {
    const { data: members } = await supabase
      .from("league_members")
      .select("user_id, weekly_xp")
      .eq("league_id", league.id)
      .order("weekly_xp", { ascending: false })
      .limit(30);

    const ids = (members ?? []).map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, equipped_outfit_slug")
      .in("id", ids);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));

    board = (members ?? []).map((m) => {
      const p = map.get(m.user_id);
      return {
        user_id: m.user_id,
        weekly_xp: m.weekly_xp,
        username: p?.username ?? null,
        display_name: p?.display_name ?? null,
        outfit: p?.equipped_outfit_slug ?? null,
      };
    });
  }

  const top: PodiumEntry[] = board.slice(0, 3).map((b) => ({
    user_id: b.user_id,
    username: b.username,
    display_name: b.display_name,
    weekly_xp: b.weekly_xp,
    outfit: b.outfit,
  }));

  const rest = board.slice(3);
  const myRank = board.findIndex((b) => b.user_id === user.id);
  const isTopTier = division.tier === DIVISIONS.length;
  const isBottomTier = division.tier === 1;

  return (
    <main className="container max-w-2xl space-y-5 py-6">
      <LevelUpDialog promo={promo} />

      <div
        className="relative overflow-hidden rounded-3xl px-5 py-5 text-white shadow-pop"
        style={{ backgroundColor: division.color }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/25">
              <Trophy size={26} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-85">
                Liga atual · semana {week}
              </p>
              <h1 className="text-2xl font-black leading-tight md:text-3xl">
                {division.name}
              </h1>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider opacity-85">
                Tier {division.tier} de {DIVISIONS.length}
              </p>
            </div>
          </div>
          <ResetTimer />
        </div>

        {myRank >= 3 && (
          <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 text-ink shadow-pop">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/55">
                Sua posição
              </p>
              <p className="text-xl font-black tabular-nums">#{myRank + 1}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/55">
                XP semanal
              </p>
              <p className="text-xl font-black tabular-nums text-gold">
                {board[myRank].weekly_xp}
              </p>
            </div>
          </div>
        )}

        <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
          <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider">
            <ChevronUp size={14} className="text-grass" />
            Top {PROMOTE_TOP} sobem
            {!isTopTier && ` → ${getDivision(DIVISIONS[division.tier].slug).name}`}
          </span>
          <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider opacity-95">
            <ChevronDown size={14} className="text-alert" />
            Últimos {RELEGATE_BOTTOM} descem
            {!isBottomTier &&
              ` → ${getDivision(DIVISIONS[division.tier - 2].slug).name}`}
          </span>
        </div>
      </div>

      {board.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto mb-2 flex h-28 w-28 items-center justify-center">
            <Mascot state="happy" size={104} />
          </div>
          <CardTitle>Sua liga ainda está vazia</CardTitle>
          <CardDesc className="mt-2">
            Comece uma lição pra entrar no ranking. Quem ganhar mais XP até{" "}
            <strong>segunda-feira 03:00 UTC</strong> sobe!
          </CardDesc>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle>Pódio da semana</CardTitle>
            <CardDesc>
              Os três pilotos com mais XP semanal levam o troféu da {division.name}.
            </CardDesc>
            <div className="mt-5">
              <Podium top={top} meId={user.id} />
            </div>
          </Card>

          <Card>
            <CardTitle>Ranking semanal</CardTitle>
            <CardDesc>Top 30 da {division.name} — atualiza em tempo real.</CardDesc>

            <ol className="mt-4 space-y-1">
              {board.map((m, i) => {
                const rank = i + 1;
                const zone =
                  rank <= PROMOTE_TOP && !isTopTier
                    ? "promote"
                    : rank > board.length - RELEGATE_BOTTOM &&
                        board.length > PROMOTE_TOP + RELEGATE_BOTTOM &&
                        !isBottomTier
                      ? "demote"
                      : null;
                return (
                  <li key={m.user_id}>
                    <LeaderboardRow
                      rank={rank}
                      username={m.username}
                      displayName={m.display_name}
                      weeklyXp={m.weekly_xp}
                      isMe={m.user_id === user.id}
                      zone={zone}
                    />
                  </li>
                );
              })}
            </ol>

            {myRank === -1 && rest.length > 0 && (
              <p className="mt-3 text-center text-xs text-ink/60">
                Você ainda não pontuou esta semana — complete uma lição pra entrar
                no ranking.
              </p>
            )}
          </Card>
        </>
      )}

      <Card>
        <CardTitle>Mapa das divisões</CardTitle>
        <CardDesc>10 ligas de Bronze até Diamante.</CardDesc>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {DIVISIONS.map((d) => {
            const here = d.slug === division.slug;
            return (
              <div
                key={d.slug}
                className="flex flex-col items-center rounded-2xl border-2 p-2 text-center"
                style={{
                  borderColor: here ? d.color : "rgba(203, 213, 225, 1)",
                  backgroundColor: here ? `${d.color}10` : "transparent",
                }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-pop"
                  style={{ backgroundColor: d.color }}
                >
                  <Trophy size={16} />
                </span>
                <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-ink">
                  {d.name}
                </span>
                <span className="text-[10px] text-ink/50">Tier {d.tier}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </main>
  );
}
