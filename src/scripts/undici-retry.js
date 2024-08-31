import { setGlobalDispatcher, Agent } from 'undici';

export default () => ({
  name: 'undici-retry',
  hooks: {
    'astro:build:start': () => {
      // Increase connect timeout for HTTP requests
      setGlobalDispatcher(new Agent({ connect: { timeout: 30000 } }));
    },
  },
});
