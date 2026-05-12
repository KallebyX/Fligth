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
      <StatCard icon={<Star className="text-gold" />} label="XP total" value={totalXp} />
      <StatCard icon={<Flame className="text-sun" />} label="Ofensiva" value={`${streak}d`} />
      <StatCard icon={<Trophy className="text-grass" />} label="Recorde" value={`${longestStreak}d`} />
      <StatCard icon={<Award className="text-sky-deep" />} label="Conquistas" value={badgesCount} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="card-pop p-3">
      <div className="mb-1">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
        {label}
      </p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}
