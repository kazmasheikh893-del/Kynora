/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070B14", // Deepest background
          900: "#0A0F1D", // Primary background
          850: "#0E162B", // Secondary background / navigation
          800: "#131D38", // Cards and panels
          750: "#182547", // Lighter cards / hover
          700: "#1F305B", // Subtle borders
          600: "#2B427B", // Active borders / highlights
        },
        accent: {
          blue: "#3B82F6",
          blueHover: "#2563EB",
          cyan: "#06B6D4",
          soft: "rgba(59, 130, 246, 0.15)",
        },
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
        },
        status: {
          urgent: "#EF4444",
          urgentSoft: "rgba(239, 68, 68, 0.15)",
          high: "#F59E0B",
          highSoft: "rgba(245, 158, 11, 0.15)",
          medium: "#3B82F6",
          mediumSoft: "rgba(59, 130, 246, 0.15)",
          low: "#64748B",
          lowSoft: "rgba(100, 116, 139, 0.15)",
          success: "#10B981",
          successSoft: "rgba(16, 185, 129, 0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};
