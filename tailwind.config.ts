import type { Config } from "tailwindcss";

const config: Config = {
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
        sky: { DEFAULT: "#0EA5E9", deep: "#0369A1" },
        sun: { DEFAULT: "#F97316", soft: "#FED7AA" },
        grass: { DEFAULT: "#10B981", deep: "#047857" },
        alert: { DEFAULT: "#EF4444", soft: "#FECACA" },
        cloud: { DEFAULT: "#F1F5F9", deep: "#CBD5E1" },
        ink: "#0F172A",
        gold: "#FBBF24",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "ui-sans-serif", "system-ui"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        pop: "0 4px 0 0 rgba(15,23,42,0.12)",
        "pop-lg": "0 6px 0 0 rgba(15,23,42,0.18)",
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
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        pop: "pop 0.4s ease-out",
        "bounce-soft": "bounceSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
