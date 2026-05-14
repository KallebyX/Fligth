import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { StatGrid } from "@/components/profile/StatGrid";
import { FollowButton } from "@/components/profile/FollowButton";
import { Button } from "@/components/ui/button";
import { CalendarDays, Pencil, Trophy } from "lucide-react";
import { getDivision } from "@/lib/leagues/divisions";

const PROFILE_COLOR_TO_BG: Record<string, string> = {
  sky: "bg-sky",
  grass: "bg-grass",
  sun: "bg-sun",
  alert: "bg-alert",
  gold: "bg-gold",
  ink: "bg-ink",
};

export type PublicProfileData = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  country_code: string | null;
  profile_color: string;
  current_league: string;
  mascot_outfit: string;
  equipped_outfit_slug: string | null;
  joined_at: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  badges_count: number;
};

export type PublicProfileProps = {
  profile: PublicProfileData;
  followers: number;
  following: number;
  isSelf: boolean;
  viewerFollowing: boolean;
  followsViewer: boolean;
};

export function PublicProfile({
  profile,
  followers,
  following,
  isSelf,
  viewerFollowing,
  followsViewer,
}: PublicProfileProps) {
  const bgClass = PROFILE_COLOR_TO_BG[profile.profile_color] ?? "bg-sky";
  const division = getDivision(profile.current_league);
  const joined = new Date(profile.joined_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div
        className={`relative overflow-hidden rounded-3xl ${bgClass} text-white shadow-pop`}
      >
        {/* Soft decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"
        />

        <div className="relative flex flex-col items-center gap-3 px-5 py-7 text-center">
          <div className="rounded-full bg-white/15 p-2 ring-4 ring-white/30">
            <Mascot state="happy" size={132} outfit={profile.equipped_outfit_slug} />
          </div>

          <div>
            <h1 className="text-2xl font-black md:text-3xl">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-sm font-bold uppercase tracking-wider opacity-80">
              @{profile.username}
            </p>
          </div>

          {profile.bio && (
            <p className="max-w-md whitespace-pre-wrap text-sm leading-snug opacity-95">
              {profile.bio}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 shadow-pop"
              style={{ color: division.color }}
            >
              <Trophy size={14} />
              Liga {division.name}
            </span>
            {profile.country_code && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 opacity-90">
                {profile.country_code}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 opacity-90">
              <CalendarDays size={14} />
              Entrou {joined}
            </span>
          </div>

          <div className="mt-3 flex w-full max-w-md items-center justify-center gap-6 text-center">
            <div>
              <p className="text-2xl font-black tabular-nums">{followers}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Seguidores
              </p>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div>
              <p className="text-2xl font-black tabular-nums">{following}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Seguindo
              </p>
            </div>
          </div>

          <div className="mt-3">
            {isSelf ? (
              <Link href="/profile/edit">
                <Button size="md" variant="outline" className="bg-white text-ink">
                  <Pencil size={16} />
                  Editar perfil
                </Button>
              </Link>
            ) : (
              <FollowButton
                targetId={profile.id}
                initialFollowing={viewerFollowing}
                followsYou={followsViewer}
                size="md"
              />
            )}
          </div>
        </div>
      </div>

      <StatGrid
        totalXp={profile.total_xp}
        streak={profile.current_streak}
        longestStreak={profile.longest_streak}
        badgesCount={profile.badges_count}
      />
    </div>
  );
}
