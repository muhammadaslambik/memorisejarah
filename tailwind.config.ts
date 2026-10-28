import type { Config } from "tailwindcss";
// Palet earth tone: charcoal, cream/sepia, gold/bronze
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: "#1f1c19", soft: "#2c2823" },
        cream: { DEFAULT: "#f5efe3", dark: "#e8dec9" },
        gold: { DEFAULT: "#b08d57", dark: "#8a6a3a" },
        ms: { bg: "#140e08", surface: "#1d140b", line: "#3a2a18", gold: "#d9b26f", cream: "#f3e7d3" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
