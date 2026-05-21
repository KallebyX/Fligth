"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Award, Trophy, UserPlus, Sparkles } from "lucide-react";
import { listRecent, markAllRead, type NotificationItem } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

export function NotificationsBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number;
  initialItems: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [hasError, setHasError] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(() => {
    start(async () => {
      try {
        const res = await listRecent();
        if (!res.ok) {
          setHasError(true);
          return;
        }
        setHasError(false);
        setItems(res.items);
        if (res.unread > 0) {
          const m = await markAllRead();
          if (!m.ok) setHasError(true);
        }
        setUnread(0);
      } catch {
        // Network error / aborted fetch / etc.
        setHasError(true);
      }
    });
  }, []);

  // Refresh contents lazily on open.
  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  // Click-outside to dismiss.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ""}`}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:text-cloud/70 dark:hover:bg-ink-light/60 dark:focus-visible:ring-offset-ink-deep"
      >
        <Bell size={18} aria-hidden />
        {hasError ? (
          <span
            title="Falha ao carregar — toque para tentar"
            aria-label="Erro ao carregar notificações"
            className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-alert text-white ring-2 ring-white dark:ring-ink-mid"
          >
            <AlertTriangle size={9} aria-hidden />
          </span>
        ) : unread > 0 ? (
          <span
            aria-hidden
            className="absolute right-1 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-alert px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white tabular-nums dark:ring-ink-mid"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[320px] max-w-[85vw] overflow-hidden rounded-2xl border border-cloud-deep bg-white shadow-pop-lg dark:border-ink-light dark:bg-ink-mid">
          <div className="flex items-center justify-between border-b border-cloud-deep/40 px-4 py-3 dark:border-ink-light/60">
            <p className="text-sm font-extrabold text-ink dark:text-cloud">Notificações</p>
            <Link
              href="/friends/feed"
              className="rounded-full px-2 py-1 text-xs font-bold text-sky hover:bg-sky/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky dark:text-sky-soft dark:hover:bg-sky/20"
              onClick={() => setOpen(false)}
            >
              Ver feed
            </Link>
          </div>
          {hasError ? (
            <div className="space-y-3 p-5 text-center text-sm">
              <p className="font-bold text-alert">
                Não foi possível carregar as notificações.
              </p>
              <button
                type="button"
                onClick={refresh}
                className="inline-flex h-9 items-center rounded-full bg-sky px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-pop hover:bg-sky-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-mid"
              >
                Tentar de novo
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink/60 dark:text-cloud/60">
              Nada por aqui ainda.
            </p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-cloud-deep/30 overflow-y-auto dark:divide-ink-light/60">
              {items.map((n) => (
                <li key={n.id} className={cn(!n.read_at && "bg-sky/5 dark:bg-sky/10")}>
                  <NotifRow item={n} onClick={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotifRow({
  item,
  onClick,
}: {
  item: NotificationItem;
  onClick: () => void;
}) {
  const p = item.payload;

  switch (item.kind) {
    case "followed_you": {
      const handle = (p.follower_username as string | null) ?? "";
      const name =
        (p.follower_display_name as string | null) ?? handle ?? "Alguém";
      const href = handle ? `/profile/${handle}` : "/friends?tab=followers";
      return (
        <Link
          href={href}
          onClick={onClick}
          className="flex items-center gap-3 px-4 py-3 hover:bg-cloud/60 focus-visible:bg-cloud/60 focus-visible:outline-none dark:hover:bg-ink-deep/40 dark:focus-visible:bg-ink-deep/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-deep">
            <UserPlus size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm leading-snug text-ink/80 dark:text-cloud/80">
              <strong className="text-ink dark:text-cloud">{name}</strong> começou a te seguir
            </span>
            <span className="block text-xs text-ink/50 dark:text-cloud/50">
              {formatRelativeTime(item.created_at)}
            </span>
          </span>
        </Link>
      );
    }
    case "outfit_unlocked": {
      return (
        <Link
          href="/profile/edit"
          onClick={onClick}
          className="flex items-center gap-3 px-4 py-3 hover:bg-cloud/60 focus-visible:bg-cloud/60 focus-visible:outline-none dark:hover:bg-ink-deep/40 dark:focus-visible:bg-ink-deep/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
            <Sparkles size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm leading-snug text-ink/80 dark:text-cloud/80">
              Novo outfit:{" "}
              <strong className="text-ink dark:text-cloud">
                {String(p.outfit_name ?? p.outfit_slug ?? "outfit")}
              </strong>
            </span>
            <span className="block text-xs text-ink/50 dark:text-cloud/50">
              {formatRelativeTime(item.created_at)}
            </span>
          </span>
        </Link>
      );
    }
    case "league_promoted": {
      return (
        <Link
          href="/leagues"
          onClick={onClick}
          className="flex items-center gap-3 px-4 py-3 hover:bg-cloud/60 focus-visible:bg-cloud/60 focus-visible:outline-none dark:hover:bg-ink-deep/40 dark:focus-visible:bg-ink-deep/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grass/20 text-grass-deep">
            <Trophy size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm leading-snug text-ink/80 dark:text-cloud/80">
              Você subiu para{" "}
              <strong className="capitalize text-ink dark:text-cloud">
                {String(p.to ?? "")}
              </strong>
            </span>
            <span className="block text-xs text-ink/50 dark:text-cloud/50">
              {formatRelativeTime(item.created_at)}
            </span>
          </span>
        </Link>
      );
    }
    default:
      return (
        <div className="flex items-center gap-3 p-3">
          <Award size={18} />
          <span className="text-sm">Atividade</span>
        </div>
      );
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
