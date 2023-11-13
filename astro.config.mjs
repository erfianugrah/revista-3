import { defineConfig } from 'astro/config';
import { remarkModifiedTime } from './src/scripts/remark-modified-time.mjs';
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://erfianugrah.com",
  integrations: [preact(), sitemap(), mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: { theme: 'dracula' },
      gfm: false,
    })],
  markdown: {
    remarkPlugins: [remarkModifiedTime]
  }
});