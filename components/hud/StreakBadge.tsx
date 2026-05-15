import { Flame, Snowflake } from "lucide-react";
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
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors",
        active ? "bg-sun/15" : "bg-cloud",
      )}
      aria-label={`Ofensiva: ${days} dias${freezes > 0 ? `, ${freezes} escudos de gelo` : ""}`}
    >
      <Flame
        size={18}
        className={cn(active ? "fill-sun text-sun" : "text-cloud-deep")}
      />
      <span className={cn("text-sm font-extrabold", active ? "text-ink" : "text-ink/50")}>
        {days}
      </span>
      {freezes > 0 && (
        <span className="ml-0.5 flex items-center gap-0.5 border-l border-cloud-deep/40 pl-1.5 text-xs font-extrabold text-sky-deep">
          <Snowflake size={12} className="fill-sky-deep/30 text-sky-deep" />
          {freezes}
        </span>
      )}
    </div>
  );
}
