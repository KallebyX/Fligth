"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo, useDragControls } from "framer-motion";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/motion";

/**
 * A native-feeling bottom sheet for mobile + centered modal for desktop.
 *
 * Features that make it "iOS-grade":
 *  • Drag handle at the top (the little bar you see on every iOS sheet).
 *  • Drag-to-dismiss with velocity threshold — flicking down closes;
 *    slow drag back up cancels.
 *  • Tap on backdrop dismisses.
 *  • Focus trap while open — Tab cycles inside the sheet, focus returns
 *    to the previously focused element on close.
 *  • `Esc` closes.
 *  • Respects prefers-reduced-motion (no spring, instant fade).
 *  • Stops body scroll while open.
 *  • Safe-area-inset-bottom honored.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  ariaLabel,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  maxWidth?: string;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const tAria = useTranslations("common.aria");
  const dragControls = useDragControls();

  // Esc to close + body scroll lock + focus trap.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        // Focus trap: keep focus inside the sheet.
        const sheet = sheetRef.current;
        if (!sheet) return;
        const focusable = sheet.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element inside the sheet (or the sheet
    // itself if there's nothing focusable).
    const t = window.setTimeout(() => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const first = sheet.querySelector<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
      );
      (first ?? sheet).focus();
    }, 80);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      // Restore focus to the trigger that opened the sheet.
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  function onDragEnd(_: unknown, info: PanInfo) {
    // Snap-dismiss if dragged far OR flicked down fast.
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 backdrop-blur-sm sm:items-center"
          onClick={() => onClose()}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          <motion.div
            ref={sheetRef}
            initial={reducedMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { y: "100%" }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 32, mass: 0.6 }
            }
            drag={reducedMotion ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            className={`w-full ${maxWidth} rounded-t-[28px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 shadow-soft-lg ring-1 ring-cloud-deep/30 dark:bg-ink-mid dark:ring-ink-light/60 sm:rounded-[28px] sm:pb-6 sm:pt-6`}
          >
            {/* Drag handle — iOS-style. Acts as the only drag-enabled
                area on touch; the rest of the sheet stays scrollable. */}
            <button
              type="button"
              onPointerDown={(e) => dragControls.start(e)}
              aria-label={tAria("dragHandle")}
              className="-mx-5 mb-2 flex w-[calc(100%+2.5rem)] items-center justify-center py-2 sm:hidden"
            >
              <span className="h-1.5 w-12 rounded-full bg-cloud-deep dark:bg-ink-light" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
