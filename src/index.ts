// Minimal Worker entry point for static assets.
//
// The Cloudflare Workers runtime provides ExportedHandler / Fetcher
// globally, but they aren't visible to `astro check`. We define the
// minimal shapes inline so this file type-checks without pulling in
// @cloudflare/workers-types as a dependency.

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: Fetcher;
}

interface ExportedHandler<E = unknown> {
  fetch?(request: Request, env: E): Promise<Response>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Redirect www -> apex with a 301 (permanent)
    if (url.hostname === "www.erfianugrah.com") {
      url.hostname = "erfianugrah.com";
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
