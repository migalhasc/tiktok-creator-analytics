import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        ink: {
          DEFAULT: "hsl(var(--ink, 0 0% 3%))",
          2: "hsl(var(--ink2, 0 0% 7%))",
          3: "hsl(var(--ink3, 0 0% 10%))",
        },
        cream: {
          DEFAULT: "hsl(var(--cream, 0 0% 92%))",
          2: "hsl(var(--cream2, 0 0% 86%))",
          3: "hsl(var(--cream3, 0 0% 60%))",
        },
        signal: "hsl(var(--signal, 0 0% 100%))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["Libre Caslon Condensed", "Georgia", "serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Airbnb Cereal", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        brandMono: ["DM Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 20px 55px -32px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
