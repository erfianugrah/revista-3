import typography from "@tailwindcss/typography";

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
      typography: {
        "no-quotes": {
          css: {
            "blockquote p:first-of-type::before": {
              content: "none !important",
            },
            "blockquote p:last-of-type::after": {
              content: "none !important",
            },
          },
        },
      },
    },
    screens: {
      sm: "800px",
      // => @media (min-width: 800px) { ... }
      md: "1200px",
      // => @media (min-width: 1200px) { ... }
      lg: "1900px",
      // => @media (min-width: 1900px) { ... }
      xl: "2500px",
      // => @media (min-width: 2500px) { ... }
      "2xl": "3800px",
      // => @media (min-width: 3800px) { ... }
    },
  },
  plugins: [typography],
  darkMode: "class",
};
