import { Trophy } from "lucide-react";
import { getDivision } from "@/lib/leagues/divisions";
import { cn } from "@/lib/utils";

export function DivisionBadge({
  slug,
  size = "md",
  showLabel = true,
  className,
}: {
  slug: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const d = getDivision(slug);
  const dim =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const icon = size === "lg" ? 28 : size === "sm" ? 14 : 18;
  const text =
    size === "lg" ? "text-base" : size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-white shadow-pop",
          dim,
        )}
        style={{ backgroundColor: d.color }}
      >
        <Trophy size={icon} />
      </span>
      {showLabel && (
        <span
          className={cn(
            "font-extrabold uppercase leading-tight tracking-wider text-ink dark:text-cloud",
            text,
          )}
        >
          {d.name}
        </span>
      )}
    </div>
  );
}
