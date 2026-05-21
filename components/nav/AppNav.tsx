"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  GraduationCap,
  Trophy,
  ShoppingBag,
  Users,
  UserCircle,
  Newspaper,
  Camera,
  Building2,
  Crown,
  Sparkles,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LabelKey =
  | "learn"
  | "feed"
  | "leagues"
  | "shop"
  | "friends"
  | "profile"
  | "gallery"
  | "schools"
  | "pro"
  | "season"
  | "invite";

type Item = {
  href: string;
  labelKey: LabelKey;
  Icon: typeof GraduationCap;
  /** Match the section if any of these prefixes are active. */
  match: (path: string) => boolean;
  /** Show in the mobile bottom tab bar (5-slot, capped). */
  mobile?: boolean;
};

const ITEMS: Item[] = [
  {
    href: "/learn",
    labelKey: "learn",
    Icon: GraduationCap,
    mobile: true,
    match: (p) => p.startsWith("/learn") || p.startsWith("/review") || p.startsWith("/exam"),
  },
  {
    href: "/friends/feed",
    labelKey: "feed",
    Icon: Newspaper,
    mobile: true,
    match: (p) => p.startsWith("/friends/feed"),
  },
  {
    href: "/leagues",
    labelKey: "leagues",
    Icon: Trophy,
    mobile: true,
    match: (p) => p.startsWith("/leagues"),
  },
  {
    href: "/shop/outfits",
    labelKey: "shop",
    Icon: ShoppingBag,
    mobile: true,
    match: (p) => p.startsWith("/shop"),
  },
  {
    href: "/profile",
    labelKey: "profile",
    Icon: UserCircle,
    mobile: true,
    match: (p) => p.startsWith("/profile") || p.startsWith("/pro"),
  },
  // Side-nav only (desktop has room; mobile keeps 5-slot tap targets ≥ 44pt).
  {
    href: "/season",
    labelKey: "season",
    Icon: Sparkles,
    match: (p) => p.startsWith("/season"),
  },
  {
    href: "/invite",
    labelKey: "invite",
    Icon: Gift,
    match: (p) => p.startsWith("/invite"),
  },
  {
    href: "/friends",
    labelKey: "friends",
    Icon: Users,
    match: (p) => p === "/friends" || p.startsWith("/friends?"),
  },
  {
    href: "/galeria",
    labelKey: "gallery",
    Icon: Camera,
    match: (p) => p.startsWith("/galeria"),
  },
  {
    href: "/escolas",
    labelKey: "schools",
    Icon: Building2,
    match: (p) => p.startsWith("/escolas"),
  },
  {
    href: "/pro",
    labelKey: "pro",
    Icon: Crown,
    match: (p) => p === "/pro" || p.startsWith("/pro/"),
  },
];

const MOBILE_ITEMS = ITEMS.filter((i) => i.mobile);

export function AppNav() {
  const pathname = usePathname() ?? "/";
  const t = useTranslations("nav");

  // Hide the bottom tab bar (and the side nav) while a lesson is running —
  // it sits above the player's Verificar/Continuar bar on mobile and steals
  // taps. Pattern: /learn/<subject>/<lesson>.
  if (/^\/learn\/[^/]+\/[^/]+/.test(pathname)) {
    return null;
  }

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cloud-deep/50 bg-white/95 shadow-soft-lg backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-ink-light/60 dark:bg-ink-mid/95 dark:supports-[backdrop-filter]:bg-ink-mid/85 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="container grid grid-cols-5 gap-1 px-1 py-1.5">
          {MOBILE_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    active ? "text-sky" : "text-ink/55 dark:text-cloud/55",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-12 items-center justify-center rounded-2xl transition-colors",
                      active ? "bg-sky/15" : "hover:bg-cloud dark:hover:bg-ink-deep",
                    )}
                  >
                    <item.Icon size={20} />
                  </span>
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop side nav (collapsed on small, expanded from md) */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-56 md:flex-col md:border-r md:border-cloud-deep/50 md:bg-white dark:md:border-ink-light/60 dark:md:bg-ink-mid"
      >
        <Link
          href="/learn"
          className="flex items-center gap-2 px-5 pb-2 pt-5 text-xl font-black tracking-tight text-sky"
        >
          <span aria-hidden>✈</span>
          <span>Lorí</span>
        </Link>
        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide transition-colors",
                    active
                      ? "bg-sky/10 text-sky dark:bg-sky/15"
                      : "text-ink/65 hover:bg-cloud hover:text-ink dark:text-cloud/65 dark:hover:bg-ink-deep dark:hover:text-cloud",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      active ? "bg-sky text-white" : "bg-cloud text-ink/70 dark:bg-ink-deep dark:text-cloud/70",
                    )}
                  >
                    <item.Icon size={18} />
                  </span>
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
