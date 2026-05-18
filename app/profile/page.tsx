import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, ChevronLeft, LogOut, Settings, UserPlus2 } from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicProfile, type PublicProfileData } from "@/components/profile/PublicProfile";
import { PendingDeletionBanner } from "@/components/profile/PendingDeletionBanner";
import { SoundHapticToggles } from "@/components/settings/SoundHapticToggles";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfileIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // First, fetch the bare profile to know if username is set.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, country_code, profile_color, profile_public, current_league, mascot_outfit, equipped_outfit_slug, joined_at, deletion_executes_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Cold-start case: a brand-new user without a profile row yet, or without
  // a chosen username. Don't redirect — render a clear onboarding card.
  if (!profile || !profile.username) {
    return <ClaimUsernameCard />;
  }

  // Hydrated profile — load the same data the /profile/[username] route uses.
  const [
    { data: stats },
    { data: badges, count: badgesCount },
    { count: followers },
    { count: following },
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
    supabase
      .from("mock_exam_attempts")
      .select("id, finished_at, total_correct, passed")
      .eq("user_id", profile.id)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_activities")
      .select("id, kind, payload, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const data: PublicProfileData = {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    country_code: profile.country_code,
    profile_color: profile.profile_color,
    current_league: profile.current_league,
    mascot_outfit: profile.mascot_outfit,
    equipped_outfit_slug: profile.equipped_outfit_slug ?? null,
    joined_at: profile.joined_at,
    total_xp: stats?.total_xp ?? 0,
    current_streak: stats?.current_streak ?? 0,
    longest_streak: stats?.longest_streak ?? 0,
    badges_count: badgesCount ?? 0,
  };

  return (
    <main className="container max-w-2xl space-y-6 py-6">
      {profile.deletion_executes_at && (
        <PendingDeletionBanner executesAt={profile.deletion_executes_at} />
      )}
      {/* Top action bar — quick access to settings + edit profile */}
      <div className="flex items-center justify-end gap-2">
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-cloud-deep bg-white px-3 py-2 text-xs font-extrabold text-ink hover:bg-cloud/40 dark:border-ink-light dark:bg-ink-mid dark:text-cloud dark:hover:bg-ink-mid/70"
        >
          <Settings size={14} />
          Configurações
        </Link>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-sky bg-sky px-3 py-2 text-xs font-extrabold text-white hover:brightness-105"
        >
          Editar
        </Link>
      </div>

      <PublicProfile
        profile={data}
        followers={followers ?? 0}
        following={following ?? 0}
        isSelf={true}
        viewerFollowing={false}
        followsViewer={false}
      />

      <Card>
        <CardTitle>Conquistas</CardTitle>
        <CardDesc>{badgesCount ?? 0} desbloqueadas</CardDesc>
        {!badges || badges.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60 dark:text-cloud/60">
            Complete sua primeira lição para desbloquear!
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {badges.map((b) => {
              const badge = (b as unknown as { badges: { slug: string; name: string; description: string; icon: string } }).badges;
              return (
                <div
                  key={badge.slug}
                  className="rounded-2xl border-2 border-cloud-deep bg-white p-3 text-center dark:border-ink-light/60 dark:bg-ink-mid"
                >
                  <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Award size={18} />
                  </div>
                  <p className="text-sm font-extrabold dark:text-cloud">{badge.name}</p>
                  <p className="text-xs text-ink/60 dark:text-cloud/60">{badge.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Atividade recente</CardTitle>
        {!activities || activities.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60 dark:text-cloud/60">Sem atividades recentes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-cloud-deep/30 text-sm dark:divide-ink-light/60">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-ink dark:text-cloud">{renderActivity(a.kind, a.payload)}</span>
                <time className="shrink-0 text-xs tabular-nums text-ink/50 dark:text-cloud/50">
                  {formatRelativeTime(a.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Histórico de simulados</CardTitle>
        {!exams || exams.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60 dark:text-cloud/60">
            Você ainda não fez nenhum simulado.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-cloud-deep/30 dark:divide-ink-light/60">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-ink dark:text-cloud">
                  {e.finished_at ? new Date(e.finished_at).toLocaleString("pt-BR") : "—"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-0.5 text-xs font-extrabold tabular-nums",
                    e.passed
                      ? "bg-grass/20 text-grass-deep"
                      : "bg-alert/20 text-alert",
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
        <CardTitle>Preferências rápidas</CardTitle>
        <CardDesc>Som e vibração — só pra este dispositivo.</CardDesc>
        <div className="mt-3">
          <SoundHapticToggles />
        </div>
        <Link href="/configuracoes" className="mt-3 inline-block text-xs font-extrabold text-sky-deep hover:underline dark:text-sky">
          Ver todas as configurações →
        </Link>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/friends">
          <Button variant="outline">Amigos</Button>
        </Link>
        <Link href="/learn">
          <Button variant="outline">
            <ChevronLeft size={16} />
            Voltar às trilhas
          </Button>
        </Link>
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
    </main>
  );
}

/**
 * Shown when the user is logged in but hasn't picked a username yet
 * (cold-start state for OAuth signups). Previously /profile redirected
 * to /profile/edit which left users wondering where the tab went —
 * now we render explicit guidance.
 */
function ClaimUsernameCard() {
  return (
    <main className="container max-w-md space-y-6 py-10">
      <Card className="text-center">
        <div className="mx-auto inline-flex">
          <Mascot state="happy" size={120} />
        </div>
        <CardTitle className="mt-3">Quase lá!</CardTitle>
        <CardDesc className="mt-2">
          Pra ter um perfil público (e disputar nas ligas), escolha um @username
          curto. Você pode mudar depois.
        </CardDesc>
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/profile/edit">
            <Button size="lg" className="w-full">
              <UserPlus2 size={16} />
              Escolher username
            </Button>
          </Link>
          <Link href="/configuracoes">
            <Button size="md" variant="outline" className="w-full">
              <Settings size={14} />
              Ir para configurações
            </Button>
          </Link>
        </div>
      </Card>
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
      return "Ganhou no jackpot!";
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
