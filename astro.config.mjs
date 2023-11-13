import { defineConfig } from 'astro/config';
import { remarkModifiedTime } from './src/scripts/remark-modified-time.mjs';
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://erfianugrah.com",
  integrations: [preact(), sitemap()],
  markdown: {
    remarkPlugins: [remarkModifiedTime]
  }
});