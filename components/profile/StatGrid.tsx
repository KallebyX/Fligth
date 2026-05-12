import { Award, Flame, Star, Trophy } from "lucide-react";

export function StatGrid({
  totalXp,
  streak,
  longestStreak,
  badgesCount,
}: {
  totalXp: number;
  streak: number;
  longestStreak: number;
  badgesCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Star size={18} />}
        tint="bg-gold/20 text-gold"
        label="XP total"
        value={totalXp.toLocaleString("pt-BR")}
      />
      <StatCard
        icon={<Flame size={18} />}
        tint="bg-sun/20 text-sun"
        label="Ofensiva"
        value={`${streak}d`}
      />
      <StatCard
        icon={<Trophy size={18} />}
        tint="bg-grass/20 text-grass-deep"
        label="Recorde"
        value={`${longestStreak}d`}
      />
      <StatCard
        icon={<Award size={18} />}
        tint="bg-sky/20 text-sky-deep"
        label="Conquistas"
        value={badgesCount}
      />
    </div>
  );
}

function StatCard({
  icon,
  tint,
  label,
  value,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="card-pop flex flex-col items-start gap-1.5 p-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tint}`}>
        {icon}
      </span>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
        {label}
      </p>
      <p className="text-lg font-black leading-none tabular-nums">{value}</p>
    </div>
  );
}
