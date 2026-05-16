"use client";

import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { MascotOutfit } from "@/components/mascot/outfits";
import { useReducedMotion } from "@/lib/motion";

export type MascotState =
  | "idle"
  | "happy"
  | "sad"
  | "celebrate"
  | "sleeping"
  | "confused"
  | "thinking";

const animations: Record<MascotState, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0],
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
  happy: { rotate: [0, -6, 6, -3, 0], transition: { duration: 0.8 } },
  sad: { y: [0, 2, 0], transition: { duration: 0.6 } },
  celebrate: {
    scale: [1, 1.12, 1],
    rotate: [0, 10, -10, 0],
    y: [0, -10, 0],
    transition: { duration: 0.9, ease: "easeOut" },
  },
  sleeping: { rotate: 0 },
  // Confused: slow side-to-side head tilt, like "huh?"
  confused: {
    rotate: [0, -5, 5, -3, 0],
    y: [0, -1, 0],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
  // Thinking: slow steady bob; paired with a "..." bubble visually if desired.
  thinking: {
    y: [0, -2, 0],
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
};

// Natural blink: long open, quick close, long open again.
const BLINK_KEYFRAMES = { scaleY: [1, 1, 0.08, 1, 1, 1, 1] };
const BLINK_TRANSITION: Transition = {
  duration: 5,
  repeat: Infinity,
  repeatDelay: 0.4,
  ease: "easeInOut",
  times: [0, 0.85, 0.9, 0.94, 0.97, 0.99, 1],
};

// Subtle wing flap so the mascot feels alive even at rest.
const WING_FLAP: TargetAndTransition = {
  rotate: [0, 3, 0, -2, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
};
const WING_FLAP_RIGHT: TargetAndTransition = {
  rotate: [0, -3, 0, 2, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
};

export function Mascot({
  state = "idle",
  size = 96,
  outfit,
}: {
  state?: MascotState;
  size?: number;
  outfit?: string | null;
}) {
  const isHappy = state === "happy" || state === "celebrate";
  const isSad = state === "sad";
  const isSleeping = state === "sleeping";
  const isConfused = state === "confused";
  const isThinking = state === "thinking";
  const reducedMotion = useReducedMotion();

  // Default outfit so users without an equipped slug still get the cap+goggles.
  const renderedOutfit = outfit ?? "aviator-classic";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      animate={reducedMotion ? undefined : animations[state]}
      aria-label={`Capitão Lorí ${state}`}
    >
      {/* Wings (behind body) with subtle flap */}
      <motion.path
        d="M22 86 Q10 96 22 116 Q32 110 30 96 Z"
        fill="#047857"
        animate={!isSleeping && !reducedMotion ? WING_FLAP : undefined}
        style={{ transformOrigin: "26px 96px" }}
      />
      <motion.path
        d="M98 86 Q110 96 98 116 Q88 110 90 96 Z"
        fill="#047857"
        animate={!isSleeping && !reducedMotion ? WING_FLAP_RIGHT : undefined}
        style={{ transformOrigin: "94px 96px" }}
      />

      {/* Body */}
      <ellipse cx="60" cy="98" rx="34" ry="34" fill="#10B981" />
      {/* Belly */}
      <ellipse cx="60" cy="104" rx="22" ry="22" fill="#FDE68A" />

      {/* Feet */}
      <ellipse cx="46" cy="132" rx="6" ry="4" fill="#F97316" />
      <ellipse cx="74" cy="132" rx="6" ry="4" fill="#F97316" />

      {/* Head */}
      <circle cx="60" cy="50" r="34" fill="#10B981" />

      {/* Cheek blush */}
      {isHappy && (
        <>
          <circle cx="38" cy="62" r="4" fill="#FCA5A5" opacity="0.55" />
          <circle cx="82" cy="62" r="4" fill="#FCA5A5" opacity="0.55" />
        </>
      )}

      {/* Thought bubble for thinking state */}
      {isThinking && !reducedMotion && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 1, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="92" cy="20" r="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="100" cy="14" r="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
          <circle cx="90" cy="14" r="0.9" fill="#0F172A" />
          <circle cx="94" cy="20" r="0.9" fill="#0F172A" />
          <circle cx="92" cy="24" r="0.9" fill="#0F172A" />
        </motion.g>
      )}

      {/* Confused: question mark hovering over head */}
      {isConfused && !reducedMotion && (
        <motion.g
          animate={{ y: [0, -3, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <text
            x="90"
            y="22"
            fontSize="22"
            fontWeight="900"
            fill="#F97316"
            stroke="#9A3412"
            strokeWidth="0.7"
          >
            ?
          </text>
        </motion.g>
      )}

      {/* Eyes — varied by state */}
      {isSleeping ? (
        <g>
          <circle cx="48" cy="46" r="9" fill="#FFFFFF" />
          <circle cx="72" cy="46" r="9" fill="#FFFFFF" />
          <path d="M42 46 Q48 50 54 46" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M66 46 Q72 50 78 46" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      ) : isSad ? (
        <g>
          <circle cx="48" cy="46" r="9" fill="#FFFFFF" />
          <circle cx="72" cy="46" r="9" fill="#FFFFFF" />
          <circle cx="48" cy="48" r="3.5" fill="#0F172A" />
          <circle cx="72" cy="48" r="3.5" fill="#0F172A" />
        </g>
      ) : isConfused ? (
        // One eye looks up-left, one looks straight — "wait, what?"
        <g>
          <circle cx="48" cy="46" r="9" fill="#FFFFFF" />
          <circle cx="72" cy="46" r="9" fill="#FFFFFF" />
          <circle cx="45" cy="44" r="3.5" fill="#0F172A" />
          <circle cx="72" cy="46" r="3.5" fill="#0F172A" />
          <circle cx="46" cy="42.5" r="1.1" fill="#FFFFFF" />
          <circle cx="73" cy="44.5" r="1.1" fill="#FFFFFF" />
        </g>
      ) : isThinking ? (
        // Both eyes look up to the side, mascot pondering
        <g>
          <circle cx="48" cy="46" r="9" fill="#FFFFFF" />
          <circle cx="72" cy="46" r="9" fill="#FFFFFF" />
          <circle cx="51" cy="43" r="3.5" fill="#0F172A" />
          <circle cx="75" cy="43" r="3.5" fill="#0F172A" />
          <circle cx="52" cy="41.5" r="1.1" fill="#FFFFFF" />
          <circle cx="76" cy="41.5" r="1.1" fill="#FFFFFF" />
        </g>
      ) : (
        <>
          <motion.g
            animate={reducedMotion ? undefined : BLINK_KEYFRAMES}
            transition={reducedMotion ? undefined : BLINK_TRANSITION}
            style={{ transformOrigin: "48px 46px" }}
          >
            <circle cx="48" cy="46" r="9" fill="#FFFFFF" />
            <circle cx="48" cy="46" r="3.5" fill="#0F172A" />
            <circle cx="49.5" cy="44.5" r="1.3" fill="#FFFFFF" />
          </motion.g>
          <motion.g
            animate={reducedMotion ? undefined : BLINK_KEYFRAMES}
            transition={reducedMotion ? undefined : BLINK_TRANSITION}
            style={{ transformOrigin: "72px 46px" }}
          >
            <circle cx="72" cy="46" r="9" fill="#FFFFFF" />
            <circle cx="72" cy="46" r="3.5" fill="#0F172A" />
            <circle cx="73.5" cy="44.5" r="1.3" fill="#FFFFFF" />
          </motion.g>
        </>
      )}

      {/* Beak — happy / sad / pursed for confused / neutral */}
      {isHappy ? (
        <>
          {/* Open beak / smile */}
          <path
            d="M52 60 Q60 76 68 60 Q60 64 52 60 Z"
            fill="#F97316"
            stroke="#9A3412"
            strokeWidth="1"
          />
          <path
            d="M55 64 Q60 70 65 64"
            stroke="#9A3412"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : isSad ? (
        <path
          d="M54 64 L66 64 L60 60 Z"
          fill="#F97316"
          stroke="#9A3412"
          strokeWidth="1"
        />
      ) : isConfused ? (
        // Slightly off-center half-open beak — "uh…"
        <path
          d="M53 62 Q60 68 66 62 Q60 65 53 62 Z"
          fill="#F97316"
          stroke="#9A3412"
          strokeWidth="1"
        />
      ) : isThinking ? (
        // Tight pursed beak — concentrating
        <path
          d="M55 62 L65 62"
          stroke="#9A3412"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M53 60 L67 60 L60 70 Z"
          fill="#F97316"
          stroke="#9A3412"
          strokeWidth="1"
        />
      )}

      {/* Outfit overlay paints over hair area / scarf — never the face */}
      <MascotOutfit slug={renderedOutfit} />
    </motion.svg>
  );
}
