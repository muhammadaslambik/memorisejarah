import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
// Palet earth tone: charcoal, cream/sepia, gold/bronze
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: "#1f1c19", soft: "#2c2823" },
        cream: { DEFAULT: "#f5efe3", dark: "#e8dec9" },
        gold: { DEFAULT: "#b08d57", dark: "#8a6a3a" },
        ms: { bg: "rgb(var(--ms-bg) / <alpha-value>)", surface: "rgb(var(--ms-surface) / <alpha-value>)", line: "rgb(var(--ms-line) / <alpha-value>)", gold: "rgb(var(--ms-gold) / <alpha-value>)", cream: "rgb(var(--ms-cream) / <alpha-value>)" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [typography],
} satisfies Config;
