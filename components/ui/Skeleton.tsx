import { cn } from "@/lib/utils";

/**
 * Shimmer-style placeholder block used in route loading.tsx files.
 * Defaults to a rounded 1-line height; pass className to size.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-xl bg-cloud-deep/40 dark:bg-ink-light/40",
        className,
      )}
    />
  );
}
