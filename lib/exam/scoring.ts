// Official ANAC PPA exam: 5 disciplines × 20 questions = 100.
// Pass requires ≥70% in EACH discipline (not the average).

export const PASS_THRESHOLD_PCT = 70;

export type ExamQuestion = {
  id: number;
  subject_slug: string;
  correct: "A" | "B" | "C" | "D";
};

export type ExamAnswers = Record<number, "A" | "B" | "C" | "D" | null>;

export type SubjectScore = { correct: number; total: number; pct: number; passed: boolean };

export type ExamResult = {
  total_correct: number;
  total: number;
  by_subject: Record<string, SubjectScore>;
  passed: boolean;
};

export function scoreExam(answers: ExamAnswers, questions: ExamQuestion[]): ExamResult {
  const by_subject: Record<string, SubjectScore> = {};
  let total_correct = 0;

  for (const q of questions) {
    const slug = q.subject_slug;
    by_subject[slug] ??= { correct: 0, total: 0, pct: 0, passed: false };
    by_subject[slug].total += 1;

    const a = answers[q.id];
    if (a && a === q.correct) {
      by_subject[slug].correct += 1;
      total_correct += 1;
    }
  }

  let passed = Object.keys(by_subject).length > 0;
  for (const s of Object.values(by_subject)) {
    s.pct = s.total === 0 ? 0 : Math.round((s.correct / s.total) * 100);
    s.passed = s.pct >= PASS_THRESHOLD_PCT;
    if (!s.passed) passed = false;
  }

  return { total_correct, total: questions.length, by_subject, passed };
}
