"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useReducedMotion } from "@/lib/motion";
import { impact } from "@/lib/haptics";

const STORAGE_KEY = "lori.onboarding.spotlight_seen.v1";
const PADDING = 8;

type Step = {
  /** CSS selector for the HUD element to spotlight. */
  selector: string;
  /** Where the callout sits relative to the cutout. */
  side: "bottom" | "top";
  eyebrow: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    selector: "[data-coach='streak']",
    side: "bottom",
    eyebrow: "Ofensiva",
    title: "Sua chama de constância",
    body: "Cada dia que você treina, esse contador sobe. Quebrou? Volta a zero.",
  },
  {
    selector: "[data-coach='hearts']",
    side: "bottom",
    eyebrow: "Vidas",
    title: "5 corações, 1 perdido por erro",
    body: "Acabaram? Espera 30min ou assina Pro pra ter coração infinito.",
  },
  {
    selector: "[data-coach='gems']",
    side: "bottom",
    eyebrow: "Gems",
    title: "Moeda do app",
    body: "Ganha com lições e roleta. Gasta em outfits do Lorí e jackpots.",
  },
  {
    selector: "[data-coach='goal']",
    side: "bottom",
    eyebrow: "Meta diária",
    title: "Bate a meta = ofensiva contada",
    body: "Mire 30 XP por dia (~1 lição). Bateu, sua chama está garantida.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function measure(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Activates after OnboardingCoach modal closes. Renders a dark overlay with
 * a cutout around each HUD element in sequence + a callout below/above.
 *
 * Recomputes bounding rects on every step change AND on window resize so
 * the cutout follows layout shifts (HUD chips change width as XP / streak
 * counts grow).
 *
 * Mount on /learn after the modal is done. Self-gates on localStorage.
 */
export function CoachSpotlight({
  active,
  onFinish,
}: {
  /** Caller flips this to true once the OnboardingCoach modal completes. */
  active: boolean;
  onFinish?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [show, setShow] = useState(false);
  const reducedMotion = useReducedMotion();

  // One-shot gate.
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        onFinish?.();
        return;
      }
    } catch {
      // ignore
    }
    // Brief delay so the modal exit animation finishes first.
    const t = window.setTimeout(() => setShow(true), 200);
    return () => window.clearTimeout(t);
  }, [active, onFinish]);

  // Recompute rect when step changes or window resizes.
  const computeRect = useCallback(() => {
    const r = measure(STEPS[step].selector);
    setRect(r);
  }, [step]);

  useEffect(() => {
    if (!show) return;
    computeRect();
    window.addEventListener("resize", computeRect);
    return () => window.removeEventListener("resize", computeRect);
  }, [show, computeRect]);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  function next() {
    void impact("light");
    if (step === STEPS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  }

  function finish() {
    markSeen();
    setShow(false);
    setStep(0);
    onFinish?.();
  }

  if (!show) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // If the target element isn't present (e.g., HeartsBar hidden because user
  // is Pro), skip this step automatically on next paint.
  if (!rect) {
    queueMicrotask(() => {
      if (isLast) {
        finish();
      } else {
        setStep((s) => s + 1);
      }
    });
    return null;
  }

  const cutout = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };
  const calloutTop = current.side === "bottom"
    ? cutout.top + cutout.height + 12
    : Math.max(16, cutout.top - 180);

  return (
    <AnimatePresence>
      <motion.div
        key="spotlight-overlay"
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[80]"
        style={{
          // SVG mask cutout — punches a rounded hole through the dim layer.
          background: "rgba(15, 23, 42, 0.7)",
        }}
        aria-hidden
      >
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <mask id="coach-cutout">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={cutout.left}
                y={cutout.top}
                width={cutout.width}
                height={cutout.height}
                rx="16"
                ry="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(15, 23, 42, 0.78)"
            mask="url(#coach-cutout)"
          />
        </svg>
      </motion.div>

      <motion.div
        key={`spotlight-callout-${step}`}
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed z-[81] max-w-[320px] rounded-3xl bg-white p-4 shadow-pop-lg dark:bg-ink-mid"
        style={{
          left: 16,
          right: 16,
          top: calloutTop,
          marginInline: "auto",
        }}
        role="dialog"
        aria-label={current.title}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky">
          {current.eyebrow}
        </p>
        <h2 className="mt-1 text-base font-black text-ink dark:text-cloud">
          {current.title}
        </h2>
        <p className="mt-1 text-sm leading-snug text-ink/70 dark:text-cloud/70">
          {current.body}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 dark:text-cloud/40">
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={finish}
              className="text-xs font-bold text-ink/55 hover:text-ink dark:text-cloud/55 dark:hover:text-cloud"
            >
              Pular
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-full bg-sky px-3 py-1.5 text-xs font-extrabold text-white hover:bg-sky-deep"
            >
              {isLast ? (
                <>
                  Bora!
                  <Check size={14} />
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
