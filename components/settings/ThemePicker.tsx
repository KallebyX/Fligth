"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme, type Theme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: Theme; Icon: typeof Sun; labelKey: "light" | "dark" | "auto" }> = [
  { value: "light", Icon: Sun,     labelKey: "light" },
  { value: "dark",  Icon: Moon,    labelKey: "dark" },
  { value: "auto",  Icon: Monitor, labelKey: "auto" },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings.theme");

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map(({ value, Icon, labelKey }) => {
        const label = t(labelKey);
        const description = t(`${labelKey}Description`);
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:focus-visible:ring-offset-ink-deep",
              active
                ? "border-sky bg-sky/10 dark:bg-sky/15"
                : "border-cloud-deep bg-white hover:bg-cloud/40 dark:border-ink-light dark:bg-ink-mid dark:hover:bg-ink-mid/70",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                active
                  ? "bg-sky text-white"
                  : "bg-cloud text-ink/70 dark:bg-ink-deep dark:text-cloud/70",
              )}
            >
              <Icon size={18} />
            </span>
            <span className="font-extrabold">{label}</span>
            <span className="text-[11px] leading-snug text-ink/60 dark:text-cloud/60">
              {description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
