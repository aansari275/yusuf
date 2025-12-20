import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        blob: "blob 7s infinite",
        float: "float 3s ease-in-out infinite",
        wave: "wave 2.5s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        gradient: "gradient 3s ease infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
