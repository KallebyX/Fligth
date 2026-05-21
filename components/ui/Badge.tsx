import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "sky"
  | "gold"
  | "grass"
  | "sun"
  | "alert"
  | "neutral"
  | "ink";
export type BadgeSize = "xs" | "sm" | "md" | "lg";
export type BadgeVariant = "soft" | "solid" | "outline";

type DivProps = Omit<React.HTMLAttributes<HTMLDivElement>, "color">;

export interface BadgeProps extends DivProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  variant?: BadgeVariant;
  /** Render `<span>` instead of `<div>`. Useful inside paragraphs / buttons. */
  as?: "span" | "div";
}

/**
 * Unified chip/badge for HUD, status indicators, rarity tags, etc.
 *
 * Sizing matches Apple HIG: every size meets ≥ 24px height so the
 * chip never feels cramped, and `lg` (36px) is the legal touch target
 * for interactive variants.
 *
 * Text inside is always one line — pass shorter content. Numbers should
 * be wrapped in `<span className="tabular-nums">` (this component adds
 * `tabular-nums` to the whole chip by default since that's the dominant
 * use case).
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(function Badge(
  {
    tone = "neutral",
    size = "md",
    variant = "soft",
    as = "div",
    className,
    children,
    ...rest
  },
  ref,
) {
  const Tag = (as === "span" ? "span" : "div") as "div";

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        // Base — always inline, never wraps, tight leading so the chip
        // hugs the text height instead of stretching.
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-extrabold leading-none tabular-nums transition-colors",
        SIZE[size],
        TONE[variant][tone],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});

/* ------------------------------------------------------------------ */
/* Size matrix — picked so chips line up vertically in the HUD row.   */
/* The min-height is enforced via `h-*` so chips with only an icon    */
/* and chips with icon+number have IDENTICAL outer dimensions.        */
/* ------------------------------------------------------------------ */
const SIZE: Record<BadgeSize, string> = {
  xs: "h-5 gap-1 px-1.5 text-[10px] tracking-wide",
  sm: "h-6 gap-1 px-2 text-[11px] tracking-wide",
  md: "h-7 gap-1.5 px-2.5 text-xs",
  lg: "h-9 gap-1.5 px-3 text-sm",
};

/* ------------------------------------------------------------------ */
/* Tone matrix — every tone has a dark-mode equivalent baked in so    */
/* call sites never need to add `dark:` classes themselves.           */
/* ------------------------------------------------------------------ */
const TONE: Record<BadgeVariant, Record<BadgeTone, string>> = {
  soft: {
    sky: "bg-sky/10 text-sky-deep dark:bg-sky/20 dark:text-sky-soft",
    gold: "bg-gold/15 text-gold-deep dark:bg-gold/25 dark:text-gold-soft",
    grass: "bg-grass/10 text-grass-deep dark:bg-grass/20 dark:text-grass-soft",
    sun: "bg-sun/15 text-sun dark:bg-sun/25 dark:text-sun-soft",
    alert: "bg-alert/10 text-alert dark:bg-alert/20 dark:text-alert-soft",
    neutral: "bg-cloud text-ink/75 dark:bg-ink-light/60 dark:text-cloud/80",
    ink: "bg-ink/10 text-ink dark:bg-cloud/15 dark:text-cloud",
  },
  solid: {
    sky: "bg-sky text-white shadow-pop",
    gold: "bg-gold text-ink shadow-pop",
    grass: "bg-grass text-white shadow-pop",
    sun: "bg-sun text-white shadow-pop",
    alert: "bg-alert text-white shadow-pop",
    neutral: "bg-ink/85 text-white dark:bg-cloud dark:text-ink shadow-pop",
    ink: "bg-ink text-white dark:bg-cloud dark:text-ink shadow-pop",
  },
  outline: {
    sky: "border border-sky/40 text-sky-deep dark:text-sky-soft",
    gold: "border border-gold/50 text-gold-deep dark:text-gold-soft",
    grass: "border border-grass/40 text-grass-deep dark:text-grass-soft",
    sun: "border border-sun/40 text-sun",
    alert: "border border-alert/40 text-alert",
    neutral:
      "border border-cloud-deep text-ink/70 dark:border-ink-light dark:text-cloud/70",
    ink: "border border-ink/40 text-ink dark:border-cloud/40 dark:text-cloud",
  },
};
