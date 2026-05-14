"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Award, Trophy, UserPlus, Sparkles } from "lucide-react";
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
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Refresh contents lazily on open.
  useEffect(() => {
    if (!open) return;
    start(async () => {
      const res = await listRecent();
      if (res.ok) {
        setItems(res.items);
        if (res.unread > 0) {
          await markAllRead();
        }
        setUnread(0);
      }
    });
  }, [open]);

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
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink/70 hover:bg-cloud"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-alert px-1 text-[10px] font-extrabold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[320px] max-w-[85vw] overflow-hidden rounded-2xl border border-cloud-deep bg-white shadow-pop-lg">
          <div className="flex items-center justify-between border-b border-cloud-deep/40 px-3 py-2">
            <p className="text-sm font-extrabold">Notificações</p>
            <Link
              href="/friends/feed"
              className="text-xs font-bold text-sky hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver feed
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink/60">
              Nada por aqui ainda.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-cloud-deep/30">
              {items.map((n) => (
                <li key={n.id} className={cn(!n.read_at && "bg-sky/5")}>
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
          className="flex items-center gap-3 p-3 hover:bg-cloud/60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-deep">
            <UserPlus size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm leading-snug">
              <strong className="text-ink">{name}</strong> começou a te seguir
            </span>
            <span className="block text-xs text-ink/50">
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
          className="flex items-center gap-3 p-3 hover:bg-cloud/60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
            <Sparkles size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm leading-snug">
              Novo outfit:{" "}
              <strong className="text-ink">
                {String(p.outfit_name ?? p.outfit_slug ?? "outfit")}
              </strong>
            </span>
            <span className="block text-xs text-ink/50">
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
          className="flex items-center gap-3 p-3 hover:bg-cloud/60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grass/20 text-grass-deep">
            <Trophy size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm leading-snug">
              Você subiu para{" "}
              <strong className="text-ink capitalize">
                {String(p.to ?? "")}
              </strong>
            </span>
            <span className="block text-xs text-ink/50">
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
