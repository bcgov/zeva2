import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        alertDanger: "#721c24",
        alertSuccess: "#155724",
        primaryBlue: "#003366",
        backgroundLightGreen: "#d4edda",
        backgroundLightBlue: "#cce5ff",
        backgroundDanger: "#fff1f2",
        backgroundWarning: "#fffed2",
        borderGrey: "#e0e0e0",
        defaultBackgroundBlue: "#38598a",
        defaultBackgroundGrey: "#f2f2f2",
        defaultLinkBlue: "#568dba",
        defaultTextBlack: "#494949",
        defaultTextBlue: "#1a5a96",
        formBackgroundGrey: "#fcfcfc",
        navBorder: "#dee2e6",
        primaryYellow: "#fcba19",
        textShadow: {
          sm: "1px 1px 2px rgba(0,0,0,0.5)",
          DEFAULT: "2px 2px 4px rgba(0,0,0,0.5)",
          lg: "3px 3px 6px rgba(0,0,0,0.5)",
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-shadow": {
          textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
        },
        ".text-shadow-sm": {
          textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
        },
        ".text-shadow-lg": {
          textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
        },
      });
    },
  ],
} satisfies Config;
