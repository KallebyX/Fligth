import { describe, it, expect } from "vitest";
import { scoreExam, type ExamQuestion } from "./scoring";

function makeQs(): ExamQuestion[] {
  const subs = ["regulamentos", "meteorologia", "navegacao", "teoria-voo", "conhecimentos-tecnicos"];
  const all: ExamQuestion[] = [];
  let id = 1;
  for (const s of subs) {
    for (let i = 0; i < 20; i++) {
      all.push({ id: id++, subject_slug: s, correct: "A" });
    }
  }
  return all;
}

describe("scoreExam", () => {
  it("100% correct passes", () => {
    const qs = makeQs();
    const answers = Object.fromEntries(qs.map((q) => [q.id, "A" as const]));
    const r = scoreExam(answers, qs);
    expect(r.passed).toBe(true);
    expect(r.total_correct).toBe(100);
    for (const sub of Object.values(r.by_subject)) {
      expect(sub.pct).toBe(100);
    }
  });

  it("70% in every subject passes", () => {
    const qs = makeQs();
    const answers: Record<number, "A" | "B" | "C" | "D"> = {};
    // First 14 of each 20 correct
    for (let i = 0; i < qs.length; i++) {
      answers[qs[i].id] = i % 20 < 14 ? "A" : "B";
    }
    const r = scoreExam(answers, qs);
    expect(r.passed).toBe(true);
    for (const sub of Object.values(r.by_subject)) {
      expect(sub.pct).toBe(70);
    }
  });

  it("69% in one subject fails the whole exam", () => {
    const qs = makeQs();
    const answers: Record<number, "A" | "B" | "C" | "D"> = {};
    for (let i = 0; i < qs.length; i++) {
      // First subject (regulamentos): only 13/20 correct
      if (qs[i].subject_slug === "regulamentos") {
        answers[qs[i].id] = i % 20 < 13 ? "A" : "B";
      } else {
        answers[qs[i].id] = "A";
      }
    }
    const r = scoreExam(answers, qs);
    expect(r.passed).toBe(false);
    expect(r.by_subject.regulamentos.passed).toBe(false);
    expect(r.by_subject.meteorologia.passed).toBe(true);
  });
});
