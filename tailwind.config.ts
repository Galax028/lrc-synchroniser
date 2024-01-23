import type { Config } from "tailwindcss";

export default {
  content: ["index.html", "./src/**/*.{svelte,js,ts,html}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Hanken Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
