import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-3 w-full overflow-hidden rounded-full bg-cloud-deep/30", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
    >
      <div
        className={cn("h-full rounded-full bg-grass transition-[width] duration-500", barClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
