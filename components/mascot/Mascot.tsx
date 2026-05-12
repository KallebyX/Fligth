"use client";

import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { MascotOutfit } from "@/components/mascot/outfits";

export type MascotState = "idle" | "happy" | "sad" | "celebrate" | "sleeping";

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
    transition: { duration: 0.9 },
  },
  sleeping: { rotate: 0 },
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

  // Default outfit so users without an equipped slug still get the cap+goggles.
  const renderedOutfit = outfit ?? "aviator-classic";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      animate={animations[state]}
      aria-label={`Capitão Lorí ${state}`}
    >
      {/* Wings (behind body) with subtle flap */}
      <motion.path
        d="M22 86 Q10 96 22 116 Q32 110 30 96 Z"
        fill="#047857"
        animate={!isSleeping ? WING_FLAP : undefined}
        style={{ transformOrigin: "26px 96px" }}
      />
      <motion.path
        d="M98 86 Q110 96 98 116 Q88 110 90 96 Z"
        fill="#047857"
        animate={!isSleeping ? WING_FLAP_RIGHT : undefined}
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

      {/* Eyes with natural blink (skipped on sad/sleeping where eyes are static). */}
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
      ) : (
        <>
          <motion.g
            animate={BLINK_KEYFRAMES}
            transition={BLINK_TRANSITION}
            style={{ transformOrigin: "48px 46px" }}
          >
            <circle cx="48" cy="46" r="9" fill="#FFFFFF" />
            <circle cx="48" cy="46" r="3.5" fill="#0F172A" />
            <circle cx="49.5" cy="44.5" r="1.3" fill="#FFFFFF" />
          </motion.g>
          <motion.g
            animate={BLINK_KEYFRAMES}
            transition={BLINK_TRANSITION}
            style={{ transformOrigin: "72px 46px" }}
          >
            <circle cx="72" cy="46" r="9" fill="#FFFFFF" />
            <circle cx="72" cy="46" r="3.5" fill="#0F172A" />
            <circle cx="73.5" cy="44.5" r="1.3" fill="#FFFFFF" />
          </motion.g>
        </>
      )}

      {/* Beak */}
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
