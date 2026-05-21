import type { Config } from "tailwindcss";

const config: Config = {
  // Manual toggle: we add `class="dark"` on <html> via the ThemeProvider so
  // we can persist user preference + honor system at the same time.
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.mdx",
  ],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        // Brand colors (work in both themes — saturation chosen to read
        // well on light and dark backgrounds without changing).
        sky: { DEFAULT: "#0EA5E9", deep: "#0369A1", soft: "#BAE6FD" },
        sun: { DEFAULT: "#F97316", soft: "#FED7AA" },
        grass: { DEFAULT: "#10B981", deep: "#047857", soft: "#A7F3D0" },
        alert: { DEFAULT: "#EF4444", soft: "#FECACA" },
        gold: { DEFAULT: "#FBBF24", deep: "#D97706", soft: "#FDE68A" },

        // Neutrals. `cloud` is the warm light surface; `ink` is the deep
        // dark surface. Each gains `deep`, `light` variants so dark mode
        // has proper layered surfaces (bg / card / elevated card).
        cloud: {
          DEFAULT: "#F1F5F9",   // body bg light
          deep: "#CBD5E1",      // border / divider light
          dim: "#E2E8F0",       // hover light
        },
        ink: {
          DEFAULT: "#0F172A",   // text light, also brand-dark
          deep: "#020617",      // body bg dark
          light: "#334155",     // border / divider dark
          mid: "#1E293B",       // card bg dark
          elevated: "#0F172A",  // elevated card bg dark (subtle contrast)
        },
      },
      fontFamily: {
        sans: [
          "var(--font-nunito)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        pop: "0 4px 0 0 rgba(15,23,42,0.12)",
        "pop-lg": "0 6px 0 0 rgba(15,23,42,0.18)",
        soft: "0 1px 2px 0 rgba(15,23,42,0.04), 0 2px 6px 0 rgba(15,23,42,0.06)",
        "soft-lg":
          "0 4px 12px -2px rgba(15,23,42,0.08), 0 8px 24px -4px rgba(15,23,42,0.10)",
        inset: "inset 0 1px 2px 0 rgba(15,23,42,0.08)",
      },
      keyframes: {
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-8px)" },
          "40%": { transform: "translateX(8px)" },
          "60%": { transform: "translateX(-6px)" },
          "80%": { transform: "translateX(6px)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
        bounceSoft: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        pop: "pop 0.4s ease-out",
        "bounce-soft": "bounceSoft 1.6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
