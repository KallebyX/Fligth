"use client";

import { Type, Eye, Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useA11y,
  type TextSize,
  type MotionPref,
  type ContrastPref,
} from "@/components/a11y/A11yProvider";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AccessibilitySection() {
  const { textSize, setTextSize, motion, setMotion, contrast, setContrast } =
    useA11y();
  const t = useTranslations("settings.accessibility");

  return (
    <div className="space-y-3">
      {/* Larger text */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky-deep dark:bg-sky/20 dark:text-sky-soft">
            <Type size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle>{t("textSize.title")}</CardTitle>
            <CardDesc>{t("textSize.description")}</CardDesc>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {(["default", "large", "xlarge"] as TextSize[]).map((v) => (
            <SegmentOption
              key={v}
              active={textSize === v}
              onClick={() => setTextSize(v)}
              label={t(`textSize.${v}`)}
              sample={
                <span
                  className={cn(
                    "font-extrabold",
                    v === "default" && "text-sm",
                    v === "large" && "text-base",
                    v === "xlarge" && "text-lg",
                  )}
                >
                  Aa
                </span>
              }
            />
          ))}
        </div>
      </Card>

      {/* Reduce motion */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grass/10 text-grass-deep dark:bg-grass/20 dark:text-grass-soft">
            <Activity size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle>{t("motion.title")}</CardTitle>
            <CardDesc>{t("motion.description")}</CardDesc>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {(["system", "reduce", "allow"] as MotionPref[]).map((v) => (
            <SegmentOption
              key={v}
              active={motion === v}
              onClick={() => setMotion(v)}
              label={t(`motion.${v}`)}
            />
          ))}
        </div>
      </Card>

      {/* High contrast */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink dark:bg-cloud/15 dark:text-cloud">
            <Eye size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle>{t("contrast.title")}</CardTitle>
            <CardDesc>{t("contrast.description")}</CardDesc>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(["default", "high"] as ContrastPref[]).map((v) => (
            <SegmentOption
              key={v}
              active={contrast === v}
              onClick={() => setContrast(v)}
              label={t(`contrast.${v}`)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function SegmentOption({
  active,
  onClick,
  label,
  sample,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sample?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:focus-visible:ring-offset-ink-deep",
        active
          ? "border-sky bg-sky/10 dark:bg-sky/15"
          : "border-cloud-deep bg-white hover:bg-cloud/40 dark:border-ink-light dark:bg-ink-mid dark:hover:bg-ink-mid/70",
      )}
    >
      <span className="text-sm font-extrabold leading-tight">{label}</span>
      {sample ? (
        <span
          aria-hidden
          className={cn(
            "shrink-0 text-ink/70 dark:text-cloud/70",
            active && "text-sky dark:text-sky-soft",
          )}
        >
          {sample}
        </span>
      ) : null}
    </button>
  );
}
