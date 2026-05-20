"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type TextSize = "default" | "large" | "xlarge";
export type MotionPref = "system" | "reduce" | "allow";
export type ContrastPref = "default" | "high";

type A11yState = {
  textSize: TextSize;
  motion: MotionPref;
  contrast: ContrastPref;
};

type A11yContextValue = A11yState & {
  setTextSize: (v: TextSize) => void;
  setMotion: (v: MotionPref) => void;
  setContrast: (v: ContrastPref) => void;
};

const A11yContext = createContext<A11yContextValue | null>(null);

const KEY_TEXT = "lori.a11y.text";
const KEY_MOTION = "lori.a11y.motion";
const KEY_CONTRAST = "lori.a11y.contrast";

const DEFAULT: A11yState = {
  textSize: "default",
  motion: "system",
  contrast: "default",
};

function readState(): A11yState {
  if (typeof window === "undefined") return DEFAULT;
  const text = window.localStorage.getItem(KEY_TEXT) as TextSize | null;
  const motion = window.localStorage.getItem(KEY_MOTION) as MotionPref | null;
  const contrast = window.localStorage.getItem(KEY_CONTRAST) as ContrastPref | null;
  return {
    textSize: text === "large" || text === "xlarge" ? text : "default",
    motion: motion === "reduce" || motion === "allow" ? motion : "system",
    contrast: contrast === "high" ? "high" : "default",
  };
}

function applyState(s: A11yState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.classList.toggle("a11y-text-large", s.textSize === "large");
  root.classList.toggle("a11y-text-xlarge", s.textSize === "xlarge");
  root.classList.toggle("a11y-contrast-high", s.contrast === "high");
  root.classList.toggle("a11y-motion-reduce", s.motion === "reduce");
  root.classList.toggle("a11y-motion-allow", s.motion === "allow");

  // Notify same-tab listeners (useReducedMotion) so they re-resolve.
  try {
    window.dispatchEvent(new CustomEvent("lori-a11y-change"));
  } catch {}
}

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<A11yState>(DEFAULT);

  // Hydrate from storage after mount (SSR safe).
  useEffect(() => {
    const s = readState();
    setState(s);
    applyState(s);
  }, []);

  const setTextSize = useCallback((v: TextSize) => {
    setState((prev) => {
      const next = { ...prev, textSize: v };
      try {
        window.localStorage.setItem(KEY_TEXT, v);
      } catch {}
      applyState(next);
      return next;
    });
  }, []);

  const setMotion = useCallback((v: MotionPref) => {
    setState((prev) => {
      const next = { ...prev, motion: v };
      try {
        window.localStorage.setItem(KEY_MOTION, v);
      } catch {}
      applyState(next);
      return next;
    });
  }, []);

  const setContrast = useCallback((v: ContrastPref) => {
    setState((prev) => {
      const next = { ...prev, contrast: v };
      try {
        window.localStorage.setItem(KEY_CONTRAST, v);
      } catch {}
      applyState(next);
      return next;
    });
  }, []);

  return (
    <A11yContext.Provider
      value={{ ...state, setTextSize, setMotion, setContrast }}
    >
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y(): A11yContextValue {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    return {
      ...DEFAULT,
      setTextSize: () => undefined,
      setMotion: () => undefined,
      setContrast: () => undefined,
    };
  }
  return ctx;
}

/**
 * Inline script run before hydration so accessibility classes are applied
 * before paint — prevents font-size flash on reload when a user has
 * "Larger text" enabled.
 */
export const A11Y_NO_FLASH_SCRIPT = `
(function(){
  try {
    var root = document.documentElement;
    var text = localStorage.getItem('${KEY_TEXT}');
    var motion = localStorage.getItem('${KEY_MOTION}');
    var contrast = localStorage.getItem('${KEY_CONTRAST}');
    if (text === 'large') root.classList.add('a11y-text-large');
    if (text === 'xlarge') root.classList.add('a11y-text-xlarge');
    if (contrast === 'high') root.classList.add('a11y-contrast-high');
    if (motion === 'reduce') root.classList.add('a11y-motion-reduce');
    if (motion === 'allow') root.classList.add('a11y-motion-allow');
  } catch (e) {}
})();
`.trim();
