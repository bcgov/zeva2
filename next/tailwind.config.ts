import type { Config } from "tailwindcss";
import { PluginAPI } from "tailwindcss/types/config";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primaryBlue: "#013366",
        primaryBlueHover: "#1E5189",
        primaryBluePressed: "#01264C",
        disabledBG: "#EDEBE9",
        primaryGold: "#FCBA19",
        textOnPrimary: "#FFFFFF",
        primaryRed: "#CE3E39",
        primaryRedHover: "#A2312D",
        primaryRedPressed: "#721F1C",

        //Status colors - validation, system messages
        success: "#42814A",
        error: "#CE3E39",
        warning: "#8E5E06",
        info: "#053662",

        // Icon colors
        primaryIcon: "#2D2D2D",
        secondaryIcon: "#474543",
        disabledIcon: "#9F9D9C",
        linkIcon: "#255A90",
        successIcon: "#42814A",
        errorIcon: "#CE3E39",
        warningIcon: "#8E5E06",
        infoIcon: "#053662",

        // Secondary & text
        primaryText: "#2d2d2d",
        secondaryText: "#474543",
        placeholder: "#9F9D9C",
        link: "#255A90",
        disabledText: "#9F9D9C",

        // Surface & background
        white: "#FFFFFF",
        lightGrey: "#FAF9F8",
        disabledSurface: "#EDEBE9",

        // Dividers/borders/overlays
        dividerMedium: "#898785",
        dividerDark: "#353433",
        overlayModal: "#000000",

        textShadow: {
          sm: "1px 1px 2px rgba(0,0,0,0.5)",
          DEFAULT: "2px 2px 4px rgba(0,0,0,0.5)",
          lg: "3px 3px 6px rgba(0,0,0,0.5)",
        },
      },
      boxShadow: {
        // Design system shadow levels
        "level-1": "0 1px 2px 0 rgba(0, 0, 0, 0.05)", // Cards, titles
        "level-2": "0 2px 4px 0 rgba(0, 0, 0, 0.08)", // Hover state on cards
        "level-3": "0 4px 8px 0 rgba(0, 0, 0, 0.12)", // Modal / pop-up
        "level-4": "0 8px 16px 0 rgba(0, 0, 0, 0.16)", // Tooltip / overlay
      },
    },
  },
  plugins: [
    function (helpers: PluginAPI) {
      helpers.addUtilities({
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
