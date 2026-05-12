import { Star } from "lucide-react";

export function XPBar({ xp }: { xp: number }) {
  const label = xp.toLocaleString("pt-BR");
  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1"
      aria-label={`${label} XP`}
    >
      <Star size={16} className="fill-gold text-gold" />
      <span className="text-sm font-extrabold tabular-nums text-ink">
        {label}
        <span className="ml-1 hidden text-ink/55 sm:inline">XP</span>
      </span>
    </div>
  );
}
