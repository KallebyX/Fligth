import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export type PodiumEntry = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  weekly_xp: number;
  outfit: string | null;
};

export function Podium({
  top,
  meId,
}: {
  top: PodiumEntry[];
  meId: string;
}) {
  // Render slots in order [2nd, 1st, 3rd] so 1st sits in the middle/up.
  const ordered = [top[1], top[0], top[2]];
  // Pedestal heights tuned so the gold base is visibly taller without
  // crowding the mascot above it on narrow screens.
  const heights = ["h-24", "h-32", "h-20"];
  // Mascot sizes scale down on mobile to fit the 320 px iPhone SE width.
  const sizesSm = [72, 96, 64];
  const sizesMd = [88, 112, 80];
  const ranks = [2, 1, 3];

  return (
    <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
      {ordered.map((entry, idx) => {
        if (!entry)
          return (
            <div key={idx} className="flex flex-col items-center">
              <div className={cn("w-full rounded-t-2xl bg-cloud-deep/40", heights[idx])} />
            </div>
          );
        const me = entry.user_id === meId;
        const handle = entry.username ?? "sem-usuario";
        const name = entry.display_name ?? handle;
        const isFirst = ranks[idx] === 1;
        return (
          <Link
            key={entry.user_id}
            href={`/profile/${handle}`}
            className="group flex flex-col items-center"
          >
            <div className="relative flex flex-col items-center">
              {isFirst && (
                <Crown
                  size={26}
                  className="mb-1 text-gold drop-shadow"
                  fill="currentColor"
                />
              )}
              <span className="sm:hidden">
                <Mascot
                  state={isFirst ? "celebrate" : "happy"}
                  size={sizesSm[idx]}
                  outfit={entry.outfit}
                />
              </span>
              <span className="hidden sm:inline">
                <Mascot
                  state={isFirst ? "celebrate" : "happy"}
                  size={sizesMd[idx]}
                  outfit={entry.outfit}
                />
              </span>
              <span
                className={cn(
                  "mt-1 max-w-[120px] truncate text-center text-xs font-extrabold",
                  me ? "text-sky" : "text-ink",
                )}
                title={name}
              >
                {name}
              </span>
              <span className="text-[11px] font-bold text-ink/60">
                {entry.weekly_xp} XP
              </span>
            </div>
            <div
              className={cn(
                "mt-1 flex w-full items-center justify-center rounded-t-2xl text-2xl font-black text-white shadow-pop",
                heights[idx],
                isFirst ? "bg-gold" : ranks[idx] === 2 ? "bg-[#94A3B8]" : "bg-[#B45309]",
              )}
            >
              {ranks[idx]}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
