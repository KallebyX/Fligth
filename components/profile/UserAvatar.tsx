"use client";

import Image from "next/image";
import { Mascot } from "@/components/mascot/Mascot";
import { cn } from "@/lib/utils";

export function UserAvatar({
  avatarUrl,
  outfit,
  size = 32,
  className,
}: {
  avatarUrl?: string | null;
  outfit?: string | null;
  size?: number;
  className?: string;
}) {
  const dim = `${size}px`;

  if (avatarUrl) {
    return (
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow",
          className,
        )}
        style={{ width: dim, height: dim }}
        aria-hidden
      >
        <Image
          src={avatarUrl}
          alt=""
          width={size * 2}
          height={size * 2}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-cloud ring-2 ring-white shadow",
        className,
      )}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <Mascot state="happy" size={Math.round(size * 0.9)} outfit={outfit ?? null} />
    </span>
  );
}
