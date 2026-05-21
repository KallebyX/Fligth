"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, COOKIE_NAME, type Locale } from "@/i18n/request";

/**
 * Persists the user's locale choice in a cookie and revalidates the
 * cache so the server re-renders the page with the new translations.
 * The cookie is 1-year long-lived and SameSite=Lax (works across
 * normal navigation but blocks CSRF write attacks).
 */
export async function setLocale(
  next: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLocale(next)) {
    return { ok: false, error: "invalid_locale" };
  }
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: next satisfies Locale,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // we need to read it from the client too
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
