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
      dsn: "https://c5c4e7a1cccf4e1b483fa4d91145b1d6@o4506353146462208.ingest.sentry.io/4506353147969536",
      sourceMapsUploadOptions: {
        project: "javascript-astro",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false
      },
    }),
  spotlightjs()],
  markdown: {
    remarkPlugins: [remarkModifiedTime, remarkReadingTime, remarkGfm]
  },
  prefetch: {
    prefetchAll: true
  },
});