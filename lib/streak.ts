// Streak logic: counts consecutive days the user completed at least one lesson.
// `streak_freezes` are consumable items that absorb a single missed day.

export type StreakState = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null; // YYYY-MM-DD
  streak_freezes: number;
};

export type StreakResult = StreakState & { changed: boolean };

function diffInDays(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86_400_000);
}

export function bumpStreak(state: StreakState, today: string): StreakResult {
  const last = state.last_activity_date;

  if (last === today) {
    return { ...state, changed: false };
  }

  let { current_streak, longest_streak, streak_freezes } = state;

  if (last == null) {
    current_streak = 1;
  } else {
    const gap = diffInDays(last, today);
    if (gap === 1) {
      current_streak += 1;
    } else if (gap > 1) {
      const missed = gap - 1;
      if (streak_freezes >= missed) {
        streak_freezes -= missed;
        current_streak += 1;
      } else {
        current_streak = 1;
      }
    } else {
      // Should not happen (clock skew?). Treat as continuation.
      current_streak += 1;
    }
  }

  if (current_streak > longest_streak) longest_streak = current_streak;

  return {
    current_streak,
    longest_streak,
    last_activity_date: today,
    streak_freezes,
    changed: true,
  };
}
