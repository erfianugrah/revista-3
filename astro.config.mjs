import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import markdoc from '@astrojs/markdoc';
import remarkGfm from 'remark-gfm';
import icon from 'astro-icon';
import { remarkReadingTime } from './src/scripts/remark-reading-time.mjs';
import undiciRetry from './src/scripts/undici-retry.js';
import react from '@astrojs/react';
// https://astro.build/config
export default defineConfig({
  site: 'https://www.erfianugrah.com',
  image: {
    domains: ['erfianugrah.com', 'cdn.erfianugrah.com'],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
  integrations: [icon(), sitemap(), mdx({
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'dracula',
    },
    gfm: false,
  }), tailwind(), markdoc(), undiciRetry(), react()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkReadingTime],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  experimental: {
    clientPrerender: true,
    // directRenderScript: true
  },
  build: {
    measuring: {
      entryBuilding: true,
      pageGeneration: true,
      bundling: true,
      rendering: true,
      assetProcessing: true,
    },
  },
});