import { setGlobalDispatcher, Agent, RetryAgent } from 'undici';

export default () => ({
  name: 'undici-retry',
  hooks: {
    'astro:build:start': () => {
      // Increase connect timeout for HTTP requests
      setGlobalDispatcher(new RetryAgent(new Agent({ connect: { timeout: 30000 } })));
    },
  },
});
