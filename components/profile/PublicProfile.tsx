import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { StatGrid } from "@/components/profile/StatGrid";
import { FollowButton } from "@/components/profile/FollowButton";
import { Button } from "@/components/ui/button";
import { CalendarDays, Pencil } from "lucide-react";

const PROFILE_COLOR_TO_BG: Record<string, string> = {
  sky: "bg-sky",
  grass: "bg-grass",
  sun: "bg-sun",
  alert: "bg-alert",
  gold: "bg-gold",
  ink: "bg-ink",
};

const LEAGUE_LABELS: Record<string, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  diamante: "Diamante",
  safira: "Safira",
  rubi: "Rubi",
  esmeralda: "Esmeralda",
  ametista: "Ametista",
  perola: "Pérola",
  obsidiana: "Obsidiana",
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
  const joined = new Date(profile.joined_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className={`overflow-hidden rounded-3xl ${bgClass} text-white shadow-pop`}>
        <div className="flex flex-col items-center gap-3 px-5 py-7 text-center">
          <Mascot state="happy" size={112} />
          <div>
            <h1 className="text-2xl font-black md:text-3xl">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-sm font-bold uppercase tracking-wider opacity-80">
              @{profile.username}
            </p>
          </div>
          {profile.bio && (
            <p className="max-w-md text-sm leading-snug opacity-95">{profile.bio}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-wider opacity-80">
            {profile.country_code && <span>{profile.country_code}</span>}
            <span className="flex items-center gap-1">
              <CalendarDays size={14} />
              entrou em {joined}
            </span>
            <span>{LEAGUE_LABELS[profile.current_league] ?? profile.current_league}</span>
          </div>

          <div className="mt-2 flex w-full max-w-md items-center justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-black">{followers}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Seguidores
              </p>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div>
              <p className="text-xl font-black">{following}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Seguindo
              </p>
            </div>
          </div>

          <div className="mt-2">
            {isSelf ? (
              <Link href="/profile/edit">
                <Button size="md" variant="outline" className="bg-white/95">
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
