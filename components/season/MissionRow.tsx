"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Gift, Gem, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { claimMissionReward, type Mission } from "@/app/actions/seasons";
import { impact, notify } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const GOAL_LABEL: Record<string, string> = {
  lessons_completed: "lições",
  perfect_lessons: "lições perfeitas",
  xp_earned: "XP",
  exams_passed: "simulados",
  streak_days: "dias de ofensiva",
  gallery_posts_approved: "fotos aprovadas",
  friends_added: "amigos",
  leagues_promoted: "promoções de liga",
};

export function MissionRow({ mission }: { mission: Mission }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pct = Math.min(100, Math.round((mission.progress / mission.goal_target) * 100));
  const canClaim = mission.completed && !mission.claimed;

  function onClaim() {
    setError(null);
    void impact("medium");
    start(async () => {
      const res = await claimMissionReward(mission.id);
      if (!res.ok) {
        void notify("error");
        setError(res.error);
        return;
      }
      void notify("success");
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "card-pop relative p-3.5 transition-shadow",
        mission.claimed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            mission.claimed
              ? "bg-grass/15 text-grass-deep"
              : mission.completed
                ? "bg-gold/20 text-gold"
                : "bg-sky/10 text-sky-deep dark:bg-sky/20 dark:text-sky",
          )}
        >
          {mission.claimed ? (
            <CheckCircle2 size={22} />
          ) : mission.completed ? (
            <Gift size={22} />
          ) : (
            <Trophy size={22} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-ink dark:text-cloud">
            {mission.title}
          </p>
          {mission.description && (
            <p className="mt-0.5 text-xs text-ink/60 dark:text-cloud/60">
              {mission.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-ink/55 dark:text-cloud/55">
            <span className="tabular-nums">
              {mission.progress} / {mission.goal_target}{" "}
              {GOAL_LABEL[mission.goal_kind] ?? mission.goal_kind}
            </span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-cloud-deep/30 dark:bg-ink-light/30"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  mission.completed ? "bg-grass" : "bg-sky",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              {mission.reward_gems > 0 && (
                <span className="inline-flex items-center gap-0.5 text-sky">
                  <Gem size={12} />
                  {mission.reward_gems}
                </span>
              )}
              {mission.reward_xp > 0 && (
                <span className="inline-flex items-center gap-0.5 text-gold">
                  +{mission.reward_xp} XP
                </span>
              )}
              {mission.reward_outfit_slug && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amethyst/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amethyst-deep">
                  Outfit
                </span>
              )}
            </div>
            {canClaim && (
              <Button size="sm" variant="primary" onClick={onClaim} disabled={pending}>
                {pending ? <Loader2 size={14} className="animate-spin" /> : "Resgatar"}
              </Button>
            )}
            {mission.claimed && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-grass-deep">
                Resgatado
              </span>
            )}
          </div>
          {error && (
            <p className="mt-1 text-[11px] font-bold text-alert">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
