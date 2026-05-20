"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Heart,
  Gem,
  Trophy,
  GraduationCap,
  X,
  ArrowRight,
  Check,
} from "lucide-react";
import { Mascot, type MascotState } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/lib/motion";
import { impact } from "@/lib/haptics";
import { CoachSpotlight } from "./CoachSpotlight";

const STORAGE_KEY = "lori.onboarding.coach_seen.v1";

type Step = {
  mascotState: MascotState;
  Icon: typeof Heart;
  tint: string;
  eyebrow: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    mascotState: "celebrate",
    Icon: GraduationCap,
    tint: "bg-sky/15 text-sky-deep",
    eyebrow: "Boas-vindas",
    title: "Oi, eu sou o Comandante Lorí!",
    description:
      "Vou te ajudar a passar na prova teórica de Piloto Privado da ANAC. 5 minutos por dia, do seu jeito.",
  },
  {
    mascotState: "happy",
    Icon: Flame,
    tint: "bg-sun/15 text-sun",
    eyebrow: "Ofensiva diária",
    title: "Sua chama de constância",
    description:
      "Cada dia que você treina, sua ofensiva sobe. Use os escudos de gelo pra não perder em dias difíceis.",
  },
  {
    mascotState: "thinking",
    Icon: Heart,
    tint: "bg-alert/15 text-alert",
    eyebrow: "Vidas",
    title: "Cuidado pra não perder o ar",
    description:
      "Você tem 5 corações. Cada erro custa um. Acabou? Espere ou assine Pro pra coração infinito.",
  },
  {
    mascotState: "celebrate",
    Icon: Gem,
    tint: "bg-sky/15 text-sky-deep",
    eyebrow: "Recompensas",
    title: "Gems pra comprar outfits",
    description:
      "Complete lições, suba de liga e gire a roleta. Use os gems na loja pra dar um up no Lorí.",
  },
  {
    mascotState: "happy",
    Icon: Trophy,
    tint: "bg-gold/20 text-gold",
    eyebrow: "Pronto!",
    title: "Vamos voar?",
    description:
      "A primeira lição é a mais importante. Conclua hoje e a chama acende. Decola!",
  },
];

export function OnboardingCoach() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightActive, setSpotlightActive] = useState(false);
  const reducedMotion = useReducedMotion();

  // Check on mount whether the coach has been seen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") {
        // Slight delay so the page can render first, avoiding a jarring
        // overlay on top of a still-loading HUD.
        const t = window.setTimeout(() => setOpen(true), 350);
        return () => window.clearTimeout(t);
      }
    } catch {
      // Private mode / SSR — silently skip.
    }
  }, []);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  function skip() {
    void impact("light");
    markSeen();
    setOpen(false);
    // Don't trigger the spotlight when the user explicitly skipped — they
    // signaled "leave me alone". Save the spotlight for users who completed
    // the intro modal happy-path.
  }

  function next() {
    void impact("light");
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      markSeen();
      setOpen(false);
      setSpotlightActive(true);
    }
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current?.Icon;

  return (
    <>
    <CoachSpotlight
      active={spotlightActive}
      onFinish={() => setSpotlightActive(false)}
    />
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-coach-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 backdrop-blur sm:items-center"
        >
          <motion.div
            key={step}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { y: 30, scale: 0.96, opacity: 0 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { y: 0, scale: 1, opacity: 1 }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { y: -10, scale: 0.97, opacity: 0 }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 220, damping: 22 }
            }
            className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-soft-lg ring-1 ring-cloud-deep/30 dark:bg-ink-mid dark:ring-ink-light/60"
          >
            {/* Skip button */}
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink/50 dark:text-cloud/50">
                {step + 1} / {STEPS.length}
              </span>
              <button
                type="button"
                onClick={skip}
                className="flex h-9 items-center gap-1 rounded-full px-3 text-xs font-extrabold text-ink/55 transition-colors hover:bg-cloud/60 hover:text-ink dark:text-cloud/55 dark:hover:bg-ink-deep/40 dark:hover:text-cloud"
                aria-label="Pular tutorial"
              >
                Pular
                <X size={14} />
              </button>
            </div>

            {/* Mascot + icon */}
            <div className="relative mx-auto mt-2 flex h-44 w-44 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-sky/15 to-transparent dark:from-sky/20" />
              <Mascot state={current.mascotState} size={150} />
              <motion.span
                key={`icon-${step}`}
                initial={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: -20 }}
                animate={reducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 16 }}
                className={`absolute -bottom-1 right-2 flex h-11 w-11 items-center justify-center rounded-full shadow-pop ring-2 ring-white dark:ring-ink-mid ${current.tint}`}
              >
                <Icon size={20} />
              </motion.span>
            </div>

            <div className="px-6 pb-2 pt-5 text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-ink/55 dark:text-cloud/55">
                {current.eyebrow}
              </p>
              <h2
                id="onboarding-coach-title"
                className="mt-1 text-xl font-black text-ink dark:text-cloud"
              >
                {current.title}
              </h2>
              <p className="mt-2 text-sm leading-snug text-ink/70 dark:text-cloud/70">
                {current.description}
              </p>
            </div>

            {/* Step indicator dots */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-sky"
                      : i < step
                        ? "w-1.5 bg-sky/40"
                        : "w-1.5 bg-cloud-deep/50 dark:bg-ink-light/60"
                  }`}
                />
              ))}
            </div>

            <div
              className="mt-4 px-5"
              style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            >
              <Button size="lg" className="w-full" onClick={next}>
                {isLast ? (
                  <>
                    <Check size={16} />
                    Bora começar!
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
