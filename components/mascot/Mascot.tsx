"use client";

import { motion, type TargetAndTransition } from "framer-motion";

export type MascotState = "idle" | "happy" | "sad" | "celebrate" | "sleeping";

const animations: Record<MascotState, TargetAndTransition> = {
  idle: { y: [0, -4, 0], transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } },
  happy: { rotate: [0, -8, 8, -4, 0], transition: { duration: 0.8 } },
  sad: { y: [0, 2, 0], transition: { duration: 0.6 } },
  celebrate: { scale: [1, 1.15, 1], rotate: [0, 12, -12, 0], transition: { duration: 0.9 } },
  sleeping: { rotate: 0 },
};

const eyeColors: Record<MascotState, string> = {
  idle: "#0F172A",
  happy: "#0F172A",
  sad: "#0F172A",
  celebrate: "#0F172A",
  sleeping: "transparent",
};

export function Mascot({ state = "idle", size = 96 }: { state?: MascotState; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      animate={animations[state]}
      aria-label={`Capitão Lorí ${state}`}
    >
      {/* body */}
      <ellipse cx="60" cy="72" rx="38" ry="34" fill="#10B981" />
      {/* belly */}
      <ellipse cx="60" cy="80" rx="22" ry="20" fill="#FDE68A" />
      {/* head */}
      <circle cx="60" cy="42" r="28" fill="#10B981" />
      {/* aviator cap */}
      <path d="M32 38 Q60 14 88 38 L86 46 Q60 34 34 46 Z" fill="#0F172A" />
      <rect x="34" y="40" width="52" height="6" fill="#FBBF24" />
      {/* goggles */}
      <circle cx="48" cy="42" r="8" fill="#0F172A" />
      <circle cx="72" cy="42" r="8" fill="#0F172A" />
      <circle cx="48" cy="42" r="6" fill="#A7F3D0" opacity="0.4" />
      <circle cx="72" cy="42" r="6" fill="#A7F3D0" opacity="0.4" />
      {/* eyes (when not sleeping) */}
      {state !== "sleeping" && (
        <>
          <circle cx="48" cy="42" r="2" fill={eyeColors[state]} />
          <circle cx="72" cy="42" r="2" fill={eyeColors[state]} />
        </>
      )}
      {state === "sleeping" && (
        <>
          <path d="M44 42 L52 42" stroke="#0F172A" strokeWidth="2" />
          <path d="M68 42 L76 42" stroke="#0F172A" strokeWidth="2" />
        </>
      )}
      {/* beak */}
      {state === "happy" || state === "celebrate" ? (
        <path d="M52 56 Q60 70 68 56 Q60 60 52 56 Z" fill="#F97316" />
      ) : state === "sad" ? (
        <path d="M52 60 Q60 52 68 60" stroke="#F97316" strokeWidth="3" fill="none" />
      ) : (
        <path d="M54 56 L66 56 L60 64 Z" fill="#F97316" />
      )}
      {/* wings */}
      <path d="M22 70 Q12 80 24 96" stroke="#047857" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M98 70 Q108 80 96 96" stroke="#047857" strokeWidth="6" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}
