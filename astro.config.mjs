import { defineConfig } from 'astro/config';
import { remarkModifiedTime } from './src/scripts/remark-modified-time.mjs';
import { remarkReadingTime } from './src/scripts/remark-reading-time.mjs';
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import markdoc from "@astrojs/markdoc";
import remarkGfm from 'remark-gfm';
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://www.erfianugrah.com",
  image: {
    domains: ["erfianugrah.com", "cdn.erfianugrah.com"]
  },
  integrations: [preact(), sitemap(), mdx({
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'dracula'
    },
    gfm: false
  }), tailwind(), markdoc(),
  sentry({
    sourceMapsUploadOptions: {
      telemetry: false,
    },
  }),
  spotlightjs()],
  markdown: {
    remarkPlugins: [remarkModifiedTime, remarkReadingTime, remarkGfm]
  },
  prefetch: {
    prefetchAll: true
  },
  experimental: {
    contentCollectionCache: true,
  },
});