import { Flame, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function StreakBadge({
  days,
  freezes = 0,
}: {
  days: number;
  freezes?: number;
}) {
  const active = days > 0;
  return (
    <Badge
      tone={active ? "sun" : "neutral"}
      size="md"
      aria-label={`Ofensiva: ${days} dias${freezes > 0 ? `, ${freezes} escudos de gelo` : ""}`}
    >
      <Flame
        size={14}
        aria-hidden
        className={cn(
          "shrink-0",
          active ? "fill-sun text-sun" : "text-cloud-deep dark:text-ink-light",
        )}
      />
      <span className={cn("font-extrabold", !active && "text-ink/50 dark:text-cloud/50")}>
        {days}
      </span>
      {freezes > 0 && (
        <>
          <span
            aria-hidden
            className="h-3 w-px bg-ink/20 dark:bg-cloud/20"
          />
          <span className="flex items-center gap-0.5 text-sky-deep dark:text-sky-soft">
            <Snowflake size={11} aria-hidden className="fill-sky-deep/30 text-sky-deep dark:fill-sky-soft/40 dark:text-sky-soft" />
            {freezes}
          </span>
        </>
      )}
    </Badge>
  );
}
