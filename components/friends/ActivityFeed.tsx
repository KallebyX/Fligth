"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ActivityItem } from "@/components/friends/ActivityItem";
import {
  getActivityById,
  getDiscoverFeed,
  getFollowingFeed,
  type FeedItem,
} from "@/app/actions/feed";
import { createClient } from "@/lib/supabase/client";

type Source = "following" | "discover";

export function ActivityFeed({
  source,
  initialItems,
  initialNextCursor,
  emptyState,
}: {
  source: Source;
  initialItems: FeedItem[];
  initialNextCursor: string | null;
  emptyState: React.ReactNode;
}) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [done, setDone] = useState(initialNextCursor === null);
  const [pending, start] = useTransition();
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (done || !loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !pending) {
          loadMore();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [done, pending, cursor]);

  // Live updates: subscribe to user_activities INSERTs. RLS filters to only
  // visible rows (own + followed). Discover tab sees the same firehose but
  // then drops events that wouldn't pass the discover view filter — for
  // simplicity, hydrate first and let getActivityById handle visibility.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`uacts:${source}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_activities" },
        async (payload) => {
          const row = payload.new as { id?: number };
          if (typeof row.id !== "number") return;
          try {
            const fresh = await getActivityById(row.id);
            if (!fresh) return;
            setItems((prev) =>
              prev.some((p) => p.id === fresh.id) ? prev : [fresh, ...prev],
            );
          } catch {
            // Realtime is bonus; failures are not user-facing.
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [source]);

  function loadMore() {
    if (done || pending) return;
    start(async () => {
      const fetcher = source === "following" ? getFollowingFeed : getDiscoverFeed;
      const res = await fetcher(cursor);
      if (!res.ok) {
        setDone(true);
        return;
      }
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
      if (res.nextCursor === null) setDone(true);
    });
  }

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div>
      <ul className="grid gap-2">
        {items.map((it) => (
          <ActivityItem key={`${it.id}-${it.user.id}`} item={it} />
        ))}
      </ul>

      {!done && (
        <div
          ref={loaderRef}
          className="mt-4 flex items-center justify-center py-4 text-ink/40"
          aria-live="polite"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider">
              Carregando mais…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
