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
      },
    },
  },
  plugins: [],
} satisfies Config;
