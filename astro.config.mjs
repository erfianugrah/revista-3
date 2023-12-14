import { defineConfig } from 'astro/config';
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import markdoc from "@astrojs/markdoc";
import remarkGfm from 'remark-gfm';
import { remarkReadingTime } from './remark-reading-time.mjs';

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
  }), tailwind(), markdoc()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkReadingTime]
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },
});