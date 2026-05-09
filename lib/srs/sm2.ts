// Simplified SM-2 (SuperMemo 2). Quality is 0-5, where 5 = perfect, 0 = blackout.
// Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
// We also expose a `nextReviewBoolean` helper that maps a simple was_correct
// boolean (typical for the lesson player) into a quality score.

export type SrsState = {
  easiness: number;       // EF, ≥ 1.3
  interval: number;       // days until next review
  repetitions: number;    // consecutive correct count
};

export type SrsResult = SrsState & {
  due_at: string;          // ISO date YYYY-MM-DD
};

export function nextReview(
  state: SrsState,
  quality: number,
  today: Date = new Date(),
): SrsResult {
  const q = Math.max(0, Math.min(5, quality));

  let { easiness, interval, repetitions } = state;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easiness);
  }

  easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easiness < 1.3) easiness = 1.3;

  const due = new Date(today);
  due.setDate(due.getDate() + interval);
  const due_at = due.toISOString().slice(0, 10);

  return { easiness, interval, repetitions, due_at };
}

// Boolean helper: correct on first try → q=5; correct after struggle → q=3;
// wrong → q=1. Caller provides `wasFirstTry` if it tracks attempts.
export function nextReviewBoolean(
  state: SrsState,
  wasCorrect: boolean,
  wasFirstTry = true,
  today: Date = new Date(),
): SrsResult {
  const quality = wasCorrect ? (wasFirstTry ? 5 : 3) : 1;
  return nextReview(state, quality, today);
}
