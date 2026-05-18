"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Plane } from "lucide-react";
import { toggleGalleryLike } from "@/app/actions/gallery";
import { cn } from "@/lib/utils";

type Poster = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_color: string;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  thumbnail_url: string;
  caption: string | null;
  aircraft_model: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  poster: Poster | null;
  likedByMe: boolean;
};

export function GalleryFeed({ items }: { items: GalleryItem[] }) {
  return (
    <ul className="space-y-6">
      {items.map((item) => (
        <PostCard key={item.id} item={item} />
      ))}
    </ul>
  );
}

function PostCard({ item }: { item: GalleryItem }) {
  const [liked, setLiked] = useState(item.likedByMe);
  const [count, setCount] = useState(item.likes_count);
  const [busy, setBusy] = useState(false);

  async function onLike() {
    if (busy) return;
    setBusy(true);
    const optimistic = !liked;
    setLiked(optimistic);
    setCount((n) => n + (optimistic ? 1 : -1));
    const res = await toggleGalleryLike(item.id);
    if (!res.ok) {
      // revert on failure
      setLiked(!optimistic);
      setCount((n) => n + (optimistic ? -1 : 1));
    } else {
      setCount(res.likesCount);
    }
    setBusy(false);
  }

  const posterName =
    item.poster?.display_name ?? item.poster?.username ?? "Piloto";
  const posterHref = item.poster?.username
    ? `/profile/${item.poster.username}`
    : null;

  return (
    <li className="overflow-hidden rounded-3xl border-2 border-cloud-deep bg-white">
      <div className="flex items-center gap-3 p-3">
        {item.poster?.avatar_url ? (
          <Image
            src={item.poster.avatar_url}
            alt={posterName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-cloud-deep"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cloud font-extrabold text-ink/70 ring-2 ring-cloud-deep">
            {posterName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {posterHref ? (
            <Link href={posterHref} className="text-sm font-extrabold hover:text-sky">
              {posterName}
            </Link>
          ) : (
            <span className="text-sm font-extrabold">{posterName}</span>
          )}
          <p className="text-[11px] text-ink/50">{formatRelativeTime(item.created_at)}</p>
        </div>
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-cloud">
        <Image
          src={item.image_url}
          alt={item.caption ?? `Foto de ${posterName}`}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
          loading="lazy"
        />
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLike}
            disabled={busy}
            aria-pressed={liked}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold transition-colors",
              liked
                ? "bg-alert/15 text-alert"
                : "bg-cloud/60 text-ink/70 hover:bg-cloud-deep/40",
            )}
          >
            <Heart size={16} className={cn(liked && "fill-alert")} />
            {count}
          </button>
          {(item.aircraft_model || item.location) && (
            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-ink/60">
              {item.aircraft_model && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5">
                  <Plane size={11} />
                  {item.aircraft_model}
                </span>
              )}
              {item.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5">
                  <MapPin size={11} />
                  {item.location}
                </span>
              )}
            </div>
          )}
        </div>
        {item.caption && (
          <p className="text-sm leading-snug">
            {posterHref ? (
              <Link href={posterHref} className="mr-1.5 font-extrabold hover:text-sky">
                {posterName}
              </Link>
            ) : (
              <span className="mr-1.5 font-extrabold">{posterName}</span>
            )}
            {item.caption}
          </p>
        )}
      </div>
    </li>
  );
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
