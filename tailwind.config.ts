import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fff6e9",
        "paper-deep": "#ffeacf",
        ink: "#2b2140",
        "ink-soft": "#6b5f80",
        sun: "#ffc53d",
        sky: "#41b6ff",
        berry: "#ff5c7a",
        mint: "#22cca0",
        grape: "#9b6bff",
        tangerine: "#ff9143",
      },
      fontFamily: {
        rounded: [
          "ui-rounded",
          "SF Pro Rounded",
          "Hiragino Maru Gothic ProN",
          "Quicksand",
          "Nunito",
          "system-ui",
          "sans-serif",
        ],
      },
      animation: {
        bob: "bob 3.2s ease-in-out infinite",
        drift: "drift 9s ease-in-out infinite",
        wave: "wave 2.6s ease-in-out infinite",
        wiggle: "wiggle 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
