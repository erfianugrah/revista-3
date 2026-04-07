import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import markdoc from "@astrojs/markdoc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import icon from "astro-icon";
import { remarkReadingTime } from "./src/scripts/remark-reading-time.mjs";
import undiciRetry from "./src/scripts/undici-retry.ts";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
// Use no-op passthrough image service in dev to skip Sharp processing.
// Images are served as-is during development; full optimization runs in production builds.
const isDev =
  process.env.NODE_ENV !== "production" && !process.argv.includes("build");

// https://astro.build/config
export default defineConfig({
  site:
    process.env.GITHUB_PAGES === "true"
      ? "https://erfianugrah.github.io"
      : "https://www.erfianugrah.com",
  base: process.env.GITHUB_PAGES === "true" ? "/revista-3" : undefined,

  image: {
    // responsiveStyles: true,
    // layout: "full-width",
    // objectFit: "contain",
    domains: ["erfianugrah.com", "image.erfi.io"],
    service: isDev
      ? { entrypoint: "astro/assets/services/noop" }
      : {
          entrypoint: "astro/assets/services/sharp",
          config: {
            limitInputPixels: false,
            avif: { effort: 4, chromaSubsampling: "4:2:0" },
            webp: { effort: 6, alphaQuality: 80 },
          },
        },
  },

  integrations: [
    icon(),
    sitemap(),
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: {
        theme: "rose-pine-dawn",
        defaultColor: false,
        themes: {
          light: "rose-pine-dawn",
          dark: "tokyo-night",
        },
        langs: [],
        wrap: true,
      },
      gfm: false,
      remarkPlugins: [remarkGfm, remarkMath, remarkReadingTime],
      rehypePlugins: [rehypeKatex],
    }),
    markdoc(),
    undiciRetry(),
    react(),
  ],

  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "rose-pine-dawn",
      defaultColor: false,
      themes: {
        light: "rose-pine-dawn",
        dark: "tokyo-night",
      },
      langs: [],
      wrap: true,
    },
    gfm: false,
    remarkPlugins: [remarkGfm, remarkMath, remarkReadingTime],
    rehypePlugins: [rehypeKatex],
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inconsolata",
      cssVariable: "--font-inconsolata",
      display: "swap",
      fallbacks: ["monospace"],
      weights: [200, 400, 700, 900],
      optimizedFallbacks: true,
    },
    {
      provider: fontProviders.fontsource(),
      name: "Overpass Mono",
      cssVariable: "--font-overpass-mono",
      display: "swap",
      fallbacks: ["monospace"],
      weights: [300, 400, 700],
      optimizedFallbacks: true,
    },
  ],

  experimental: {
    clientPrerender: true,
    // responsiveImages: true,
    // directRenderScript: true
  },

  build: {
    concurrency: 4,
    measuring: {
      entryBuilding: true,
      pageGeneration: true,
      bundling: true,
      rendering: true,
      assetProcessing: true,
    },
  },

  security: {
    checkOrigin: false,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
