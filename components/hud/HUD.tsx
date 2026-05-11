import Link from "next/link";
import { HeartsBar } from "./HeartsBar";
import { XPBar } from "./XPBar";
import { StreakBadge } from "./StreakBadge";
import { Crown } from "lucide-react";

export function HUD({
  xp,
  streak,
  hearts,
  isPro = false,
}: {
  xp: number;
  streak: number;
  hearts: number;
  isPro?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-cloud-deep/40 bg-white/85 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/learn" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-sky">
          <span aria-hidden>✈</span>
          <span>Capitão Lorí</span>
          {isPro && (
            <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-gold">
              <Crown size={10} />
              Pro
            </span>
          )}
        </Link>
        <div className="flex items-center gap-3">
          <StreakBadge days={streak} />
          <XPBar xp={xp} />
          {isPro ? (
            <Link href="/pro" className="hidden text-xs font-extrabold text-gold sm:inline">
              Pro
            </Link>
          ) : (
            <>
              <HeartsBar hearts={hearts} />
              <Link
                href="/pro"
                className="hidden rounded-full bg-gold/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-gold sm:inline-flex"
              >
                Upgrade
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
