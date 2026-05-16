"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";

type ThemeContextValue = {
  theme: Theme;
  resolved: "light" | "dark"; // What's actually applied right now
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "lori.theme";

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "auto") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function applyClass(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial state: read from storage if available; default to auto.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "auto";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "auto";
  });
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme =
      stored === "light" || stored === "dark" ? stored : "auto";
    return resolveTheme(initial);
  });

  // React to system preference changes when set to auto.
  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const next = e.matches ? "dark" : "light";
      setResolved(next);
      applyClass(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Apply class on theme change.
  useEffect(() => {
    const r = resolveTheme(theme);
    setResolved(r);
    applyClass(r);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, t);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Soft fallback so the hook doesn't throw if used outside the provider
    // (during SSR / static pages that don't wrap in ThemeProvider).
    return {
      theme: "auto",
      resolved: "light",
      setTheme: () => undefined,
    };
  }
  return ctx;
}

/**
 * Inline script that runs BEFORE React hydrates. Reads the stored theme
 * (or falls back to system preference) and applies the `dark` class
 * immediately. This prevents the white-flash-on-load that hits every
 * dark-mode app that boots from a server-rendered light HTML.
 *
 * Inject this into <head> via `dangerouslySetInnerHTML`.
 */
export const NO_FLASH_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'auto';
    var resolved = theme;
    if (resolved === 'auto') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`.trim();
