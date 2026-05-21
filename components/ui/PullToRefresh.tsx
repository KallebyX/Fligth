"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, type Transition } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/lib/motion";
import { impact } from "@/lib/haptics";

const TRIGGER_DISTANCE = 80;
const MAX_PULL = 140;
const SPRING: Transition = { type: "spring", stiffness: 380, damping: 32 };

/**
 * iOS-style pull-to-refresh wrapper.
 *
 * Wrap a scrollable section in <PullToRefresh> and the user can drag
 * downward FROM THE TOP to trigger a refresh. While dragging, an arrow
 * appears and rotates as the threshold approaches. Letting go past the
 * threshold runs `onRefresh()` (defaults to router.refresh()), shows a
 * spinner while it resolves, then snaps back to the natural scroll
 * position.
 *
 * Touch-only — does not interfere with mouse / trackpad scrolling on
 * desktop. Disabled if the page is currently scrolled (only fires when
 * the user is at the very top of the page).
 */
export function PullToRefresh({
  children,
  onRefresh,
  className,
}: {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  className?: string;
}) {
  const router = useRouter();
  const pull = useMotionValue(0);
  const arrowRotate = useTransform(pull, [0, TRIGGER_DISTANCE], [0, 180]);
  const startY = useRef<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hapticFired, setHapticFired] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const el = document.scrollingElement ?? document.documentElement;

    function onTouchStart(e: TouchEvent) {
      if (refreshing) return;
      if ((el?.scrollTop ?? 0) > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      setHapticFired(false);
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || refreshing) return;
      // If user scrolled into the page during the gesture, abort.
      if ((el?.scrollTop ?? 0) > 0) {
        startY.current = null;
        pull.set(0);
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        pull.set(0);
        return;
      }
      // Resist past 80px so it feels like rubber.
      const resisted =
        dy <= TRIGGER_DISTANCE
          ? dy
          : TRIGGER_DISTANCE + Math.sqrt(dy - TRIGGER_DISTANCE) * 6;
      const clamped = Math.min(resisted, MAX_PULL);
      pull.set(clamped);
      // Fire one-time haptic on threshold crossing.
      if (!hapticFired && clamped >= TRIGGER_DISTANCE) {
        void impact("medium");
        setHapticFired(true);
      }
      // Prevent the page from elastic-bouncing under us in iOS Safari.
      if (dy > 0) e.preventDefault();
    }

    async function onTouchEnd() {
      if (startY.current == null) return;
      startY.current = null;
      const current = pull.get();
      if (current >= TRIGGER_DISTANCE && !refreshing) {
        setRefreshing(true);
        try {
          if (onRefresh) await onRefresh();
          else router.refresh();
        } finally {
          // Settle delay so the user sees the spinner briefly even on fast
          // networks — feels intentional instead of glitchy.
          window.setTimeout(() => {
            setRefreshing(false);
            pull.set(0);
          }, 450);
        }
      } else {
        pull.set(0);
      }
    }

    // passive:false on touchmove so we can preventDefault the bounce.
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pull, refreshing, hapticFired, onRefresh, router, reducedMotion]);

  return (
    <div className={className}>
      {/* Indicator — pinned at the top, translates down with pull. */}
      <motion.div
        aria-hidden="true"
        style={{ y: refreshing ? TRIGGER_DISTANCE : pull, opacity: pull }}
        transition={refreshing ? SPRING : undefined}
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
      >
        <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sky shadow-soft-lg ring-1 ring-cloud-deep/40 dark:bg-ink-mid dark:text-sky dark:ring-ink-light/60">
          {refreshing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <motion.span style={{ rotate: arrowRotate }} className="inline-flex">
              <ArrowDown size={18} />
            </motion.span>
          )}
        </div>
      </motion.div>

      <motion.div
        style={{ y: refreshing ? TRIGGER_DISTANCE : pull }}
        transition={refreshing ? SPRING : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}
