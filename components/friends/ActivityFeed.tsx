"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ActivityItem } from "@/components/friends/ActivityItem";
import {
  getDiscoverFeed,
  getFollowingFeed,
  type FeedItem,
} from "@/app/actions/feed";

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
