import { Star } from "lucide-react";

export function XPBar({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1">
      <Star size={18} className="fill-gold text-gold" />
      <span className="text-sm font-extrabold text-ink">{xp.toLocaleString("pt-BR")} XP</span>
    </div>
  );
}
