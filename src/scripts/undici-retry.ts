import { setGlobalDispatcher, Agent, RetryAgent } from "undici";

export default () => ({
  name: "undici-retry",
  hooks: {
    "astro:build:start": () => {
      setGlobalDispatcher(
        new RetryAgent(new Agent({ connect: { timeout: 30000 } })),
      );
    },
  },
});
