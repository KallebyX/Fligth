"use client";

import { motion } from "framer-motion";
import { Mascot } from "@/components/mascot/Mascot";
import { useReducedMotion } from "@/lib/motion";

type Variant = "roulette" | "jackpot";

type Segment = {
  fill: string;
  label?: string;
};

const ROULETTE_SEGMENTS: Segment[] = [
  { fill: "#0EA5E9" }, // sky
  { fill: "#10B981" }, // grass
  { fill: "#F97316" }, // sun
  { fill: "#A78BFA" }, // purple
  { fill: "#0EA5E9" },
  { fill: "#10B981" },
  { fill: "#F97316" },
  { fill: "#A78BFA" },
];

const JACKPOT_SEGMENTS: Segment[] = [
  { fill: "#FBBF24" }, // gold
  { fill: "#F59E0B" }, // amber
  { fill: "#FBBF24" },
  { fill: "#EAB308" },
  { fill: "#FBBF24" },
  { fill: "#F59E0B" },
  { fill: "#FBBF24" },
  { fill: "#EAB308" },
];

/**
 * A real spinning wheel for the roulette/jackpot. SVG segments rotate so the
 * user actually sees motion (not just a Mascot rotating in a circle). The
 * mascot sits centered on top in the hub and stays upright while the wheel
 * spins underneath — same trick Duolingo's chest reveals use.
 */
export function SpinningWheel({
  variant,
  spinAngle,
  spinning,
  outfit,
  size = 180,
}: {
  variant: Variant;
  spinAngle: number;
  spinning: boolean;
  outfit?: string | null;
  size?: number;
}) {
  const reducedMotion = useReducedMotion();
  const segments = variant === "jackpot" ? JACKPOT_SEGMENTS : ROULETTE_SEGMENTS;
  const segCount = segments.length;
  const angleStep = 360 / segCount;
  const r = 50; // viewBox is 0..100
  const cx = 50;
  const cy = 50;
  const mascotSize = Math.round(size * 0.46);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Pointer at the top of the wheel (decorative — actual outcome is
          decided server-side; the pointer is just for visual feedback). */}
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path
            d="M11 2 L20 18 L2 18 Z"
            fill={variant === "jackpot" ? "#FBBF24" : "#0F172A"}
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Rotating segmented wheel */}
      <motion.svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        animate={reducedMotion ? {} : { rotate: spinAngle }}
        transition={{
          duration: variant === "jackpot" ? 2.6 : 2.0,
          ease: [0.16, 1, 0.3, 1], // strong easeOut for "wheel slowing down" feel
        }}
        className="drop-shadow-lg"
        style={{ filter: variant === "jackpot" ? "drop-shadow(0 0 12px rgba(251,191,36,0.45))" : undefined }}
      >
        {/* Outer ring (rim) */}
        <circle cx={cx} cy={cy} r={r - 1} fill="#FFFFFF" />

        {/* Segments */}
        {segments.map((seg, i) => {
          const start = i * angleStep - 90;
          const end = start + angleStep;
          const startRad = (start * Math.PI) / 180;
          const endRad = (end * Math.PI) / 180;
          const x1 = cx + (r - 4) * Math.cos(startRad);
          const y1 = cy + (r - 4) * Math.sin(startRad);
          const x2 = cx + (r - 4) * Math.cos(endRad);
          const y2 = cy + (r - 4) * Math.sin(endRad);
          const largeArc = angleStep > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r - 4} ${r - 4} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return (
            <path
              key={i}
              d={d}
              fill={seg.fill}
              stroke="#FFFFFF"
              strokeWidth="1.2"
              opacity={spinning ? 0.96 : 0.82}
            />
          );
        })}

        {/* Inner hub circle so the mascot sits clean on top */}
        <circle cx={cx} cy={cy} r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />

        {/* Decorative dots around the rim for "wheel" feel */}
        {Array.from({ length: segCount }).map((_, i) => {
          const a = (i * angleStep + angleStep / 2 - 90) * (Math.PI / 180);
          const x = cx + (r - 6) * Math.cos(a);
          const y = cy + (r - 6) * Math.sin(a);
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r="1.4"
              fill="#FFFFFF"
            />
          );
        })}
      </motion.svg>

      {/* Mascot sits centered and stays upright (counter-rotates if needed) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: mascotSize,
          height: mascotSize,
        }}
      >
        <Mascot
          state={spinning ? "thinking" : variant === "jackpot" ? "celebrate" : "happy"}
          size={mascotSize}
          outfit={outfit}
        />
      </div>
    </div>
  );
}
