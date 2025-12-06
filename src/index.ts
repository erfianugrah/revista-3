// Minimal Worker entry point for static assets
export default {
	async fetch(request, env) {
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;

interface Env {
	ASSETS: Fetcher;
}
