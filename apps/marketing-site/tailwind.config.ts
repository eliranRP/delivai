import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#5B4FE8",
          "primary-dark": "#4a3fd6",
          secondary: "#10B981",
          accent: "#F59E0B",
          danger: "#EF4444",
          surface: "#F8F7FF",
          text: "#1A1A2E",
          "text-muted": "#6B7280",
        },
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "var(--font-inter)", "sans-serif"],
        body: ["var(--font-inter)", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #5B4FE8 0%, #7C3AED 50%, #2563EB 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(91,79,232,0.08) 0%, rgba(16,185,129,0.08) 100%)",
      },
      boxShadow: {
        card: "0 4px 24px rgba(91,79,232,0.12), 0 1px 4px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 40px rgba(91,79,232,0.2), 0 2px 8px rgba(0,0,0,0.08)",
        glow: "0 0 40px rgba(91,79,232,0.25)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "bounce-slow": "bounce 2s ease-in-out infinite",
        "gradient": "gradient 8s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
