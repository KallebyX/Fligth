import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicProfile, type PublicProfileData } from "@/components/profile/PublicProfile";
import { SoundHapticToggles } from "@/components/settings/SoundHapticToggles";
import { createClient } from "@/lib/supabase/server";
import { Award, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, country_code, profile_color, profile_public, current_league, mascot_outfit, joined_at",
    )
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const isSelf = profile.id === viewer.id;
  if (!profile.profile_public && !isSelf) {
    return (
      <main className="container max-w-md py-16 text-center">
        <Lock className="mx-auto mb-4 text-ink/40" size={48} />
        <h1 className="text-2xl font-black">Perfil privado</h1>
        <p className="mt-2 text-sm text-ink/60">
          @{profile.username} mantém o perfil privado.
        </p>
        <Link href="/friends" className="mt-6 inline-block">
          <Button variant="outline">Voltar</Button>
        </Link>
      </main>
    );
  }

  const [
    { data: stats },
    { data: badges, count: badgesCount },
    { count: followers },
    { count: following },
    { count: viewerFollowingCount },
    { count: followsViewerCount },
    { data: exams },
    { data: activities },
  ] = await Promise.all([
    supabase
      .from("user_stats")
      .select("total_xp, current_streak, longest_streak")
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("user_badges")
      .select("earned_at, badges(slug, name, description, icon)", { count: "exact" })
      .eq("user_id", profile.id)
      .order("earned_at", { ascending: false })
      .limit(12),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    isSelf
      ? Promise.resolve({ count: 0 })
      : supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", viewer.id)
          .eq("followed_id", profile.id),
    isSelf
      ? Promise.resolve({ count: 0 })
      : supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profile.id)
          .eq("followed_id", viewer.id),
    isSelf
      ? supabase
          .from("mock_exam_attempts")
          .select("id, finished_at, total_correct, passed")
          .eq("user_id", profile.id)
          .not("finished_at", "is", null)
          .order("finished_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as Array<{ id: string; finished_at: string | null; total_correct: number | null; passed: boolean | null }> }),
    supabase
      .from("user_activities")
      .select("id, kind, payload, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const data: PublicProfileData = {
    id: profile.id,
    username: profile.username!,
    display_name: profile.display_name,
    bio: profile.bio,
    country_code: profile.country_code,
    profile_color: profile.profile_color,
    current_league: profile.current_league,
    mascot_outfit: profile.mascot_outfit,
    joined_at: profile.joined_at,
    total_xp: stats?.total_xp ?? 0,
    current_streak: stats?.current_streak ?? 0,
    longest_streak: stats?.longest_streak ?? 0,
    badges_count: badgesCount ?? 0,
  };

  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <PublicProfile
        profile={data}
        followers={followers ?? 0}
        following={following ?? 0}
        isSelf={isSelf}
        viewerFollowing={(viewerFollowingCount ?? 0) > 0}
        followsViewer={(followsViewerCount ?? 0) > 0}
      />

      <Card>
        <CardTitle>Conquistas</CardTitle>
        <CardDesc>{badgesCount ?? 0} desbloqueadas</CardDesc>
        {!badges || badges.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">
            {isSelf ? "Complete sua primeira lição para desbloquear!" : "Sem conquistas ainda."}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {badges.map((b) => {
              const badge = (b as unknown as { badges: { slug: string; name: string; description: string; icon: string } }).badges;
              return (
                <div key={badge.slug} className="rounded-2xl border-2 border-cloud-deep bg-white p-3 text-center">
                  <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Award size={18} />
                  </div>
                  <p className="text-sm font-extrabold">{badge.name}</p>
                  <p className="text-xs text-ink/60">{badge.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Atividade recente</CardTitle>
        {!activities || activities.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">Sem atividades recentes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-cloud-deep/30 text-sm">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <span>{renderActivity(a.kind, a.payload)}</span>
                <time className="shrink-0 text-xs text-ink/50">
                  {formatRelativeTime(a.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isSelf && (
        <>
          <Card>
            <CardTitle>Histórico de simulados</CardTitle>
            {!exams || exams.length === 0 ? (
              <p className="mt-3 text-sm text-ink/60">Você ainda não fez nenhum simulado.</p>
            ) : (
              <ul className="mt-3 divide-y divide-cloud-deep/30">
                {exams.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">
                      {e.finished_at ? new Date(e.finished_at).toLocaleString("pt-BR") : "—"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-0.5 text-xs font-extrabold",
                        e.passed ? "bg-grass/20 text-grass-deep" : "bg-alert/20 text-alert",
                      )}
                    >
                      {e.total_correct}/100 · {e.passed ? "Aprovado" : "Não aprovado"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Preferências</CardTitle>
            <CardDesc>Sons e vibração. Fica salvo neste dispositivo.</CardDesc>
            <div className="mt-3">
              <SoundHapticToggles />
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Link href="/friends"><Button variant="outline">Amigos</Button></Link>
            <Link href="/learn"><Button variant="outline">Voltar às trilhas</Button></Link>
            <form
              action={async () => {
                "use server";
                const sb = await createClient();
                await sb.auth.signOut();
                redirect("/");
              }}
            >
              <Button type="submit" variant="ghost">
                <LogOut size={16} />
                Sair
              </Button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}

function renderActivity(kind: string | null, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  switch (kind) {
    case "lesson_completed":
      return `Completou a lição "${String(p.lesson_title ?? "")}"${p.perfect ? " (perfeito!)" : ""}`;
    case "badge_earned":
      return `Desbloqueou a conquista "${String(p.badge_name ?? p.badge_slug ?? "")}"`;
    case "exam_passed":
      return `Passou no simulado com ${String(p.total_correct ?? "?")}/100`;
    case "streak_milestone":
      return `Atingiu ${String(p.streak ?? "?")} dias de ofensiva`;
    case "league_promoted":
      return `Subiu para a liga ${String(p.to ?? "?")}`;
    case "outfit_unlocked":
      return `Desbloqueou o outfit "${String(p.outfit_name ?? p.outfit_slug ?? "")}"`;
    case "jackpot_win":
      return `Ganhou no jackpot!`;
    default:
      return "Atividade";
  }
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
