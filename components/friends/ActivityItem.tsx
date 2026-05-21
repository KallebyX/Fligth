import Link from "next/link";
import {
  Award,
  ChevronRight,
  Flame,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { FeedItem } from "@/app/actions/feed";
import { cn } from "@/lib/utils";

type RenderInfo = {
  icon: React.ReactNode;
  text: React.ReactNode;
  tint: string;
};

function renderInfo(item: FeedItem): RenderInfo {
  const p = item.payload;
  switch (item.kind) {
    case "lesson_completed":
      return {
        icon: <GraduationCap size={18} />,
        tint: "bg-sky/15 text-sky-deep",
        text: (
          <>
            completou{" "}
            <strong className="text-ink">
              {String(p.lesson_title ?? "uma lição")}
            </strong>
            {Boolean(p.has_mixed_kinds) && (
              <span
                title="Lição com exercícios interativos"
                className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-sky/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-deep align-middle"
              >
                interativa
              </span>
            )}
            {Boolean(p.perfect) && " com tudo certo 🌟"}
          </>
        ),
      };
    case "badge_earned":
      return {
        icon: <Award size={18} />,
        tint: "bg-gold/20 text-gold",
        text: (
          <>
            desbloqueou a conquista{" "}
            <strong className="text-ink">
              {String(p.badge_name ?? p.badge_slug ?? "")}
            </strong>
          </>
        ),
      };
    case "exam_passed":
      return {
        icon: <ShieldCheck size={18} />,
        tint: "bg-grass/20 text-grass-deep",
        text: (
          <>
            passou no simulado com{" "}
            <strong className="text-ink">
              {String(p.total_correct ?? "?")}/100
            </strong>
          </>
        ),
      };
    case "streak_milestone":
      return {
        icon: <Flame size={18} />,
        tint: "bg-sun/20 text-sun",
        text: (
          <>
            atingiu{" "}
            <strong className="text-ink">{String(p.streak ?? "?")} dias</strong>{" "}
            de ofensiva
          </>
        ),
      };
    case "league_promoted":
      return {
        icon: <Trophy size={18} />,
        tint: "bg-gold/20 text-gold",
        text: (
          <>
            subiu para a liga{" "}
            <strong className="text-ink capitalize">
              {String(p.to ?? "?")}
            </strong>
          </>
        ),
      };
    case "outfit_unlocked":
      return {
        icon: <Sparkles size={18} />,
        tint: "bg-grass/20 text-grass-deep",
        text: (
          <>
            desbloqueou o outfit{" "}
            <strong className="text-ink">
              {String(p.outfit_name ?? p.outfit_slug ?? "")}
            </strong>
          </>
        ),
      };
    case "jackpot_win":
      return {
        icon: <Sparkles size={18} />,
        tint: "bg-gold/20 text-gold",
        text: <>acabou de ganhar no jackpot 🎰</>,
      };
    default:
      return { icon: <Sparkles size={18} />, tint: "bg-cloud text-ink/60", text: <>fez algo</> };
  }
}

export function ActivityItem({ item }: { item: FeedItem }) {
  const info = renderInfo(item);
  const handle = item.user.username ?? "sem-usuario";
  const name = item.user.display_name ?? handle;
  const href = `/profile/${handle}`;
  return (
    <li>
      <Link
        href={href}
        className="card-pop flex items-center gap-3 p-3 transition-colors hover:bg-cloud/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:hover:bg-ink-deep/40 dark:focus-visible:ring-offset-ink-deep"
      >
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            info.tint,
          )}
        >
          {info.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug text-ink/80 dark:text-cloud/80">
            <span className="font-extrabold text-ink dark:text-cloud">{name}</span>{" "}
            {info.text}
          </p>
          <p className="mt-0.5 text-xs text-ink/50 dark:text-cloud/50">
            {formatRelativeTime(item.created_at)}
          </p>
        </div>
        <ChevronRight
          size={18}
          aria-hidden
          className="shrink-0 text-ink/30 dark:text-cloud/30"
        />
      </Link>
    </li>
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
