import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/profile/UserAvatar";

type Zone = "promote" | "demote" | "stay" | null;

export function LeaderboardRow({
  rank,
  username,
  displayName,
  avatarUrl,
  outfit,
  weeklyXp,
  isMe,
  zone,
}: {
  rank: number;
  username: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  outfit?: string | null;
  weeklyXp: number;
  isMe: boolean;
  zone: Zone;
}) {
  const handle = username ?? "sem-usuario";
  const name = displayName ?? handle;
  return (
    <Link
      href={username ? `/profile/${username}` : "#"}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors",
        isMe
          ? "bg-sky/10 dark:bg-sky/15"
          : "hover:bg-cloud/60 dark:hover:bg-ink-mid/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
            zone === "promote"
              ? "bg-grass text-white"
              : zone === "demote"
                ? "bg-alert text-white"
                : "bg-cloud text-ink/70 dark:bg-ink-light/40 dark:text-cloud/70",
          )}
        >
          {rank}
        </span>
        <UserAvatar avatarUrl={avatarUrl} outfit={outfit} size={36} />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm font-extrabold",
              isMe ? "text-sky" : "text-ink dark:text-cloud",
            )}
          >
            {name}
            {isMe && (
              <span className="ml-1 text-xs font-bold uppercase tracking-wider text-sky">
                você
              </span>
            )}
          </p>
          <p className="truncate text-[11px] text-ink/50 dark:text-cloud/50">
            @{handle}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-black text-gold">
        {weeklyXp} XP
      </span>
    </Link>
  );
}
