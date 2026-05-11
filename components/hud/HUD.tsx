import Link from "next/link";
import { HeartsBar } from "./HeartsBar";
import { XPBar } from "./XPBar";
import { StreakBadge } from "./StreakBadge";

export function HUD({
  xp,
  streak,
  hearts,
}: {
  xp: number;
  streak: number;
  hearts: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-cloud-deep/40 bg-white/85 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/learn" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-sky">
          <span aria-hidden>✈</span>
          <span>Capitão Lorí</span>
          <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/50">não-oficial</span>
        </Link>
        <div className="flex items-center gap-3">
          <StreakBadge days={streak} />
          <XPBar xp={xp} />
          <HeartsBar hearts={hearts} />
        </div>
      </div>
    </header>
  );
}
