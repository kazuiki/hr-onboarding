import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: "#011f4b",
          navy: "#03396c",
          primary: "#005b96",
          muted: "#6497b1",
          ice: "#b3cde0",
          "ice-light": "#eaf2f8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
