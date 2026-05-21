import Link from "next/link";
import { HeartsBar } from "./HeartsBar";
import { XPBar } from "./XPBar";
import { StreakBadge } from "./StreakBadge";
import { GemsBadge } from "./GemsBadge";
import { DailyGoalRing } from "./DailyGoalRing";
import { NotificationsBell } from "./NotificationsBell";
import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { NotificationItem } from "@/app/actions/notifications";

async function loadNotifications(): Promise<{
  items: NotificationItem[];
  unread: number;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { items: [], unread: 0 };

    const [{ data: rows }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, kind, payload, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);

    const items: NotificationItem[] = (rows ?? []).map((r) => ({
      id: r.id,
      kind: r.kind as NotificationItem["kind"],
      payload: ((r.payload as Json | null) ?? {}) as Record<string, unknown>,
      read_at: r.read_at,
      created_at: r.created_at,
    }));
    return { items, unread: count ?? 0 };
  } catch {
    return { items: [], unread: 0 };
  }
}

export async function HUD({
  xp,
  streak,
  hearts,
  gems = 0,
  isPro = false,
  todayXp,
  goalXp,
  freezes = 0,
}: {
  xp: number;
  streak: number;
  hearts: number;
  gems?: number;
  isPro?: boolean;
  todayXp?: number;
  goalXp?: number;
  freezes?: number;
}) {
  const { items, unread } = await loadNotifications();

  return (
    <header
      className="sticky top-0 z-40 border-b border-cloud-deep/40 bg-white/85 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:border-ink-light/60 dark:bg-ink-mid/80 dark:supports-[backdrop-filter]:bg-ink-mid/70"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="container flex min-h-14 items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <Link
          href="/learn"
          aria-label="Início — CMTE Lorí"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-1 text-lg font-extrabold tracking-tight text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:focus-visible:ring-offset-ink-deep"
        >
          <span aria-hidden className="text-xl leading-none">✈</span>
          <span className="hidden leading-none sm:inline">CMTE Lorí</span>
          <span className="leading-none sm:hidden">Lorí</span>
          {isPro && (
            <Badge tone="gold" size="xs" className="ml-0.5 uppercase tracking-wider">
              <Crown size={9} aria-hidden className="shrink-0" />
              Pro
            </Badge>
          )}
        </Link>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span data-coach="streak" className="flex">
            <StreakBadge days={streak} freezes={freezes} />
          </span>
          {todayXp != null && goalXp != null && (
            <span data-coach="goal" className="flex">
              <DailyGoalRing todayXp={todayXp} goalXp={goalXp} />
            </span>
          )}
          <span data-coach="gems" className="flex">
            <GemsBadge gems={gems} />
          </span>
          <XPBar xp={xp} />
          {!isPro && (
            <span data-coach="hearts" className="flex">
              <HeartsBar hearts={hearts} />
            </span>
          )}
          {!isPro && (
            <Link
              href="/pro"
              className="hidden h-7 items-center rounded-full bg-gold px-3 text-[11px] font-extrabold uppercase tracking-wider text-ink shadow-pop transition-colors hover:bg-gold-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:focus-visible:ring-offset-ink-deep sm:inline-flex"
            >
              Upgrade
            </Link>
          )}
          <NotificationsBell initialUnread={unread} initialItems={items} />
        </div>
      </div>
    </header>
  );
}
