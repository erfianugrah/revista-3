import { defineConfig } from 'astro/config';
import { remarkModifiedTime } from './src/scripts/remark-modified-time.mjs';
import { remarkReadingTime } from './src/scripts/remark-reading-time.mjs';
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import markdoc from "@astrojs/markdoc";
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  site: "https://www.erfianugrah.com",
  image: {
    domains: ["erfianugrah.com"]
  },
  integrations: [preact(), sitemap(), mdx({
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'dracula'
    },
    gfm: false
  }), tailwind(), markdoc()],
  markdown: {
    remarkPlugins: [remarkModifiedTime, remarkReadingTime, remarkGfm]
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  }
});