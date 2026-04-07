import { setGlobalDispatcher, Agent, RetryAgent } from "undici";

export default () => ({
  name: "undici-retry",
  hooks: {
    "astro:build:start": () => {
      const agent = new Agent({
        connect: { timeout: 30_000 },
        bodyTimeout: 120_000,
        headersTimeout: 30_000,
        pipelining: 1,
        connections: 6,
      });

      setGlobalDispatcher(
        new RetryAgent(agent, {
          maxRetries: 5,
          minTimeout: 1_000,
          maxTimeout: 60_000,
          timeoutFactor: 2,
          retryAfter: true,
          statusCodes: [408, 429, 500, 502, 503, 504],
          errorCodes: [
            "ECONNRESET",
            "ECONNREFUSED",
            "ENOTFOUND",
            "ENETDOWN",
            "ENETUNREACH",
            "EHOSTDOWN",
            "EHOSTUNREACH",
            "EPIPE",
            "UND_ERR_SOCKET",
            "UND_ERR_BODY_TIMEOUT",
            "UND_ERR_HEADERS_TIMEOUT",
            "UND_ERR_CONNECT_TIMEOUT",
          ],
        }),
      );
    },
  },
});
