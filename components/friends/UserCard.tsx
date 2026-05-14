import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { FollowButton } from "@/components/profile/FollowButton";
import type { DiscoverUser } from "@/app/actions/discover";

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

export function UserCard({ user }: { user: DiscoverUser }) {
  const handle = user.username ?? "sem-usuario";
  return (
    <div className="card-pop flex items-center gap-3 p-3">
      <Link
        href={`/profile/${handle}`}
        className="flex flex-1 items-center gap-3"
      >
        <div className="shrink-0">
          <Mascot state="idle" size={56} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold">
            {user.display_name ?? handle}
          </p>
          <p className="truncate text-xs text-ink/60">
            @{handle}
            {user.current_league && (
              <>
                <span className="mx-1.5">·</span>
                <span className="font-bold uppercase tracking-wider text-ink/70">
                  {LEAGUE_LABELS[user.current_league] ?? user.current_league}
                </span>
              </>
            )}
          </p>
          {user.follows_you && (
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-sky">
              Segue você
            </p>
          )}
        </div>
      </Link>
      <FollowButton
        targetId={user.id}
        initialFollowing={user.is_following}
        followsYou={user.follows_you}
        size="sm"
      />
    </div>
  );
}
