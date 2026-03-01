/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        "overpass-mono": [
          "var(--font-overpass-mono)",
          "Overpass Mono",
          "monospace",
        ],
        inconsolata: ["var(--font-inconsolata)", "Inconsolata", "monospace"],
      },
      objectPosition: {
        "top-33": "center top 33.33%",
        "top-50": "center top 50%",
      },
      backgroundPosition: {
        "center-33": "center 33.33%",
      },
      backgroundSize: {
        "size-66": "100% 66.67%",
      },
    },
    screens: {
      sm: "800px",
      md: "1200px",
      lg: "1900px",
      xl: "2500px",
      "2xl": "3800px",
    },
  },
  // IMPORTANT: use require(), not import — see src/styles/global.css for why
  plugins: [require("@tailwindcss/typography")],
  darkMode: "class",
};
