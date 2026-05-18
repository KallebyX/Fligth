import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const SUPPORTED = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof SUPPORTED)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";
export const COOKIE_NAME = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  // We split messages by locale; the bundles stay <30KB gzipped each.
  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
