"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { MockExamTimer } from "@/components/exam/MockExamTimer";
import { startExam, submitExam } from "@/app/actions/exam";
import { cn } from "@/lib/utils";
import { impact } from "@/lib/haptics";
import { useSfx } from "@/components/learn/useSfx";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

const EXAM_DURATION_MS = 3 * 60 * 60 * 1000; // 3h
const STORAGE_KEY = "lori.exam.session";

type ExamQ = {
  id: number;
  subject_slug: string;
  subject_name: string;
  stem: string;
  choices: Record<"A" | "B" | "C" | "D", string>;
};

type Session = {
  attemptId: string;
  startedAt: number;
  questions: ExamQ[];
  answers: Record<number, "A" | "B" | "C" | "D" | null>;
};

export function ExamRunner() {
  const router = useRouter();
  const sfx = useSfx();
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showNav, setShowNav] = useState(false);

  // Restore from storage if present.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as Session;
      if (s.startedAt + EXAM_DURATION_MS > Date.now()) setSession(s);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  async function handleStart() {
    setStarting(true);
    const res = await startExam();
    setStarting(false);
    if (!res.ok) return;
    setSession({
      attemptId: res.attemptId,
      startedAt: Date.now(),
      questions: res.questions,
      answers: Object.fromEntries(res.questions.map((q) => [q.id, null])),
    });
    setIndex(0);
  }

  async function handleSubmit() {
    if (!session || submitting) return;
    setSubmitting(true);
    const res = await submitExam({ attemptId: session.attemptId, answers: session.answers });
    setSubmitting(false);
    if (!res.ok) return;
    window.localStorage.removeItem(STORAGE_KEY);
    router.push(`/exam/results/${res.attemptId}`);
  }

  if (!session) {
    return (
      <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-12 text-center">
        <Mascot state="happy" size={140} />
        <h1 className="text-3xl font-black md:text-4xl">Simulado no formato da banca</h1>
        <p className="text-sm text-ink/60">Mesma estrutura da prova teórica de Piloto Privado da ANAC.</p>
        <Card className="max-w-lg space-y-3 text-left">
          <p>
            <strong>100 questões</strong> distribuídas em 5 matérias × 20.
          </p>
          <p>
            <strong>3 horas</strong> de duração.
          </p>
          <p>
            <strong>Aprovação:</strong> mínimo 70% em CADA matéria — exatamente como na prova real.
          </p>
          <p className="text-sm text-ink/60">
            Sem feedback durante a prova. Você pode navegar entre as questões livremente.
          </p>
        </Card>
        <Button size="lg" onClick={handleStart} disabled={starting} variant="warn">
          {starting ? "Carregando..." : "Iniciar simulado"}
        </Button>
      </main>
    );
  }

  const current = session.questions[index];
  const answered = Object.values(session.answers).filter((a) => a !== null).length;

  function selectChoice(choice: "A" | "B" | "C" | "D") {
    if (!current) return;
    setSession((s) =>
      s ? { ...s, answers: { ...s.answers, [current.id]: choice } } : s,
    );
    sfx.play("tap");
    void impact("light");
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
    void impact("light");
  }

  function goNext() {
    setIndex((i) => Math.min(session ? session.questions.length - 1 : i, i + 1));
    void impact("light");
  }

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-30 border-b border-cloud-deep/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container flex h-14 max-w-2xl items-center justify-between px-4">
          <span className="text-sm font-extrabold">
            <span className="text-ink">{index + 1}</span>
            <span className="text-ink/40"> / {session.questions.length}</span>
            <span className="ml-2 hidden text-xs font-bold uppercase tracking-wide text-ink/50 sm:inline">
              · {answered} respondidas
            </span>
          </span>
          <MockExamTimer
            startedAt={session.startedAt}
            durationMs={EXAM_DURATION_MS}
            onExpire={handleSubmit}
          />
        </div>
      </header>

      <div className="container max-w-2xl flex-1 px-4 pb-44 pt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-sky">{current.subject_name}</p>
        <h2 className="mb-6 mt-1 text-[22px] font-extrabold leading-snug md:text-2xl">{current.stem}</h2>

        <div className="grid gap-3 select-none">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const isSelected = session.answers[current.id] === letter;
            return (
              <button
                key={letter}
                onClick={() => selectChoice(letter)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className={cn(
                  "flex min-h-[64px] items-center gap-4 rounded-2xl border-2 p-4 text-left touch-manipulation transition-colors active:scale-[0.99]",
                  isSelected ? "border-sky bg-sky/10" : "border-cloud-deep bg-white hover:bg-cloud",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold",
                    isSelected ? "bg-sky text-white" : "bg-cloud text-ink/70",
                  )}
                >
                  {letter}
                </span>
                <span className="text-base leading-snug md:text-[17px]">{current.choices[letter]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-cloud-deep/40 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container flex max-w-2xl items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={goPrev}
            disabled={index === 0}
            aria-label="Questão anterior"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setShowNav((v) => !v)}
            aria-label="Mapa de questões"
          >
            <LayoutGrid size={16} />
            <span className="ml-1 hidden sm:inline">Mapa</span>
          </Button>
          {index + 1 < session.questions.length ? (
            <Button
              size="md"
              className="ml-auto flex-1 sm:flex-none"
              onClick={goNext}
            >
              Próxima
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Button
              size="md"
              variant="warn"
              className="ml-auto flex-1 sm:flex-none"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Finalizar"}
            </Button>
          )}
        </div>

        {showNav && (
          <div className="container mt-3 max-w-2xl">
            <div className="max-h-[40vh] overflow-y-auto rounded-2xl bg-cloud/60 p-2">
              <div className="grid grid-cols-10 gap-1.5">
                {session.questions.map((q, i) => {
                  const a = session.answers[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setIndex(i);
                        setShowNav(false);
                        void impact("light");
                      }}
                      className={cn(
                        "h-9 rounded-lg text-xs font-bold touch-manipulation",
                        i === index
                          ? "bg-sky text-white"
                          : a
                            ? "bg-grass/30 text-grass-deep"
                            : "bg-white text-ink/60",
                      )}
                      aria-label={`Questão ${i + 1}${a ? " (respondida)" : ""}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </footer>
    </main>
  );
}
