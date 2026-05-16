"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: Theme; label: string; Icon: typeof Sun; description: string }> = [
  {
    value: "light",
    label: "Claro",
    Icon: Sun,
    description: "Branco e leve — bom pra dia.",
  },
  {
    value: "dark",
    label: "Escuro",
    Icon: Moon,
    description: "Preto e calmo — bom pra noite.",
  },
  {
    value: "auto",
    label: "Automático",
    Icon: Monitor,
    description: "Segue o sistema (iOS / Android / browser).",
  },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map(({ value, label, Icon, description }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-colors",
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
