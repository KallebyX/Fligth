"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { code: "pt-BR", flag: "🇧🇷", labelKey: "ptBR" as const },
  { code: "en",    flag: "🇺🇸", labelKey: "en" as const },
  { code: "es",    flag: "🇪🇸", labelKey: "es" as const },
];

export function LanguagePicker() {
  const t = useTranslations("settings.language");
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  function pick(code: string) {
    if (code === current || pending) return;
    startTransition(async () => {
      await setLocale(code);
    });
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {OPTIONS.map(({ code, flag, labelKey }) => {
          const active = current === code;
          return (
            <li key={code}>
              <button
                type="button"
                onClick={() => pick(code)}
                disabled={pending}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:focus-visible:ring-offset-ink-deep",
                  active
                    ? "border-sky bg-sky/10 text-sky-deep dark:bg-sky/15 dark:text-cloud"
                    : "border-cloud-deep bg-white text-ink hover:bg-cloud/40 dark:border-ink-light dark:bg-ink-mid dark:text-cloud dark:hover:bg-ink-mid/70",
                  pending && "opacity-60",
                )}
              >
                <span aria-hidden className="text-xl">{flag}</span>
                <span className="flex-1">{t(labelKey)}</span>
                {pending && active ? (
                  <Loader2 size={16} className="animate-spin text-sky" />
                ) : active ? (
                  <Check size={16} className="text-sky" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] leading-snug text-ink/55 dark:text-cloud/55">
        {t("subcopy")}
      </p>
    </div>
  );
}
