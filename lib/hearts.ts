// Hearts regenerate one by one, every 30 minutes, capped at 5.
// "Compute on read": we never run a cron — the API recalculates whenever
// it needs the current value, and persists the new value if it changed.

export const MAX_HEARTS = 5;
export const REGEN_INTERVAL_MS = 30 * 60 * 1000;

export type HeartState = {
  hearts: number;
  hearts_regen_at: string | null; // ISO timestamp
};

export type HeartComputed = {
  hearts: number;
  hearts_regen_at: string | null;
  changed: boolean;
};

export function computeHearts(state: HeartState, now: Date = new Date()): HeartComputed {
  const { hearts, hearts_regen_at } = state;

  if (hearts >= MAX_HEARTS) {
    return { hearts: MAX_HEARTS, hearts_regen_at: null, changed: hearts_regen_at !== null };
  }
  if (!hearts_regen_at) {
    // No regen scheduled but missing a heart — start the timer now.
    return {
      hearts,
      hearts_regen_at: new Date(now.getTime() + REGEN_INTERVAL_MS).toISOString(),
      changed: true,
    };
  }

  const regenStart = new Date(hearts_regen_at).getTime();
  if (now.getTime() < regenStart) {
    return { hearts, hearts_regen_at, changed: false };
  }

  const elapsed = now.getTime() - regenStart;
  const earned = 1 + Math.floor(elapsed / REGEN_INTERVAL_MS);
  const newHearts = Math.min(MAX_HEARTS, hearts + earned);

  let newRegenAt: string | null = null;
  if (newHearts < MAX_HEARTS) {
    const consumedMs = earned * REGEN_INTERVAL_MS;
    newRegenAt = new Date(regenStart + consumedMs).toISOString();
  }

  return { hearts: newHearts, hearts_regen_at: newRegenAt, changed: true };
}

// Called when the user gets a wrong answer in a lesson (not in /review).
export function loseHeart(state: HeartState, now: Date = new Date()): HeartComputed {
  const after = Math.max(0, state.hearts - 1);
  // If we had max hearts, schedule the first regen 30 min from now.
  const regenAt =
    after >= MAX_HEARTS
      ? null
      : state.hearts_regen_at ?? new Date(now.getTime() + REGEN_INTERVAL_MS).toISOString();
  return { hearts: after, hearts_regen_at: regenAt, changed: true };
}
