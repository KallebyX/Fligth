"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Trophy,
  ShoppingBag,
  Users,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  Icon: typeof GraduationCap;
  /** Match the section if any of these prefixes are active. */
  match: (path: string) => boolean;
};

const ITEMS: Item[] = [
  {
    href: "/learn",
    label: "Aprender",
    Icon: GraduationCap,
    match: (p) => p.startsWith("/learn") || p.startsWith("/review") || p.startsWith("/exam"),
  },
  {
    href: "/leagues",
    label: "Ligas",
    Icon: Trophy,
    match: (p) => p.startsWith("/leagues"),
  },
  {
    href: "/shop/outfits",
    label: "Loja",
    Icon: ShoppingBag,
    match: (p) => p.startsWith("/shop"),
  },
  {
    href: "/friends",
    label: "Amigos",
    Icon: Users,
    match: (p) => p.startsWith("/friends"),
  },
  {
    href: "/profile",
    label: "Perfil",
    Icon: UserCircle,
    match: (p) => p.startsWith("/profile") || p.startsWith("/pro"),
  },
];

export function AppNav() {
  const pathname = usePathname() ?? "/";

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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cloud-deep/50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="container grid grid-cols-5 gap-1 px-1 py-1.5">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    active ? "text-sky" : "text-ink/55",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-12 items-center justify-center rounded-2xl transition-colors",
                      active ? "bg-sky/15" : "hover:bg-cloud",
                    )}
                  >
                    <item.Icon size={20} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop side nav (collapsed on small, expanded from md) */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-56 md:flex-col md:border-r md:border-cloud-deep/50 md:bg-white"
      >
        <Link
          href="/learn"
          className="flex items-center gap-2 px-5 pb-2 pt-5 text-xl font-black tracking-tight text-sky"
        >
          <span aria-hidden>✈</span>
          <span>Lorí</span>
        </Link>
        <ul className="flex flex-1 flex-col gap-1 p-3">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide transition-colors",
                    active
                      ? "bg-sky/10 text-sky"
                      : "text-ink/65 hover:bg-cloud hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      active ? "bg-sky text-white" : "bg-cloud text-ink/70",
                    )}
                  >
                    <item.Icon size={18} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
