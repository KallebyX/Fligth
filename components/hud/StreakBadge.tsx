import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakBadge({ days }: { days: number }) {
  const active = days > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1 transition-colors",
        active ? "bg-sun/15" : "bg-cloud",
      )}
      aria-label={`Ofensiva: ${days} dias`}
    >
      <Flame
        size={18}
        className={cn(active ? "fill-sun text-sun" : "text-cloud-deep")}
      />
      <span className={cn("text-sm font-extrabold", active ? "text-ink" : "text-ink/50")}>
        {days}
      </span>
    </div>
  );
}
