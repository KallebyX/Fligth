"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Mascot } from "@/components/mascot/Mascot";
import { MockExamTimer } from "@/components/exam/MockExamTimer";
import { startExam, submitExam } from "@/app/actions/exam";
import { cn } from "@/lib/utils";
import { impact } from "@/lib/haptics";
import { useSfx } from "@/components/learn/useSfx";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  EyeOff,
  Hourglass,
  LayoutGrid,
  ListChecks,
  Loader2,
  Percent,
} from "lucide-react";

function RuleRow({
  icon,
  tint,
  label,
  desc,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-extrabold text-ink">{label}</span>
        <span className="block text-xs text-ink/65">{desc}</span>
      </span>
    </li>
  );
}

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
      <main className="container max-w-2xl space-y-6 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sun to-alert text-white shadow-pop">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-white/10"
          />
          <div className="relative grid items-center gap-3 px-5 py-6 sm:grid-cols-[auto,1fr]">
            <div className="flex justify-center">
              <div className="rounded-full bg-white/15 p-2 ring-4 ring-white/30">
                <Mascot state="celebrate" size={128} />
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                <ClipboardCheck size={12} />
                Simulado
              </span>
              <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">
                Encare a banca da ANAC
              </h1>
              <p className="mt-1 text-sm leading-snug opacity-95">
                Mesma estrutura da prova teórica de Piloto Privado.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardTitle>Como funciona</CardTitle>
          <CardDesc className="mt-1">
            Cinco matérias × vinte questões = 100, no mesmo formato da prova.
          </CardDesc>

          <ul className="mt-4 space-y-3">
            <RuleRow
              icon={<ListChecks size={18} />}
              tint="bg-sky/15 text-sky-deep"
              label="100 questões"
              desc="20 por matéria — Regulamentos, Meteo, Navegação, Teoria de voo, Conhecimentos técnicos."
            />
            <RuleRow
              icon={<Hourglass size={18} />}
              tint="bg-sun/15 text-sun"
              label="3 horas"
              desc="Timer fixo. Auto-submete ao final do tempo."
            />
            <RuleRow
              icon={<Percent size={18} />}
              tint="bg-grass/15 text-grass-deep"
              label="≥ 70 % em cada matéria"
              desc="Não basta a média — uma reprovação por matéria já reprova o todo."
            />
            <RuleRow
              icon={<EyeOff size={18} />}
              tint="bg-ink/10 text-ink"
              label="Sem feedback durante"
              desc="Você navega livremente; o resultado sai só ao finalizar."
            />
          </ul>
        </Card>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={starting}
          variant="warn"
          className="w-full"
        >
          {starting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Carregando questões…
            </>
          ) : (
            <>
              <ClipboardCheck size={18} />
              Iniciar simulado
            </>
          )}
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
                        "h-11 rounded-lg text-xs font-bold touch-manipulation",
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
