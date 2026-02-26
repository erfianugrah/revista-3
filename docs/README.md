# Documentation Index

Central entry point for the project docs. Start here, then dive deeper as needed.

Each doc now lives as a `README.md` inside the directory it describes — GitHub renders it automatically when browsing that folder.

- **Contributor Guide:** `../AGENTS.md` — repo expectations, commands, and PR norms.
- **Architecture:** `../src/README.md` — component structure, rendering approach, data flow.
- **Performance:** `performance.md` — image strategy, caching, Pagefind, and build optimizations.
- **CI/CD & Deployments:** `../.github/CICD.md` — GitHub Actions, Cloudflare/Deno, GitHub Pages flow.
- **Components:** `../src/components/README.md` — Astro/React components, Props interfaces, hydration.
- **Layouts:** `../src/layouts/README.md` — page templates, slot usage, frontmatter contracts.
- **Pages:** `../src/pages/README.md` — routes, SSG, dynamic paths, tag pages.
- **Content Collections:** `../src/content/README.md` — schemas, naming (`YYYY-MM-DD-slug.mdx`), and frontmatter rules.
- **Docker:** `docker.md` — container build/run steps, Caddy config.
- **CV Components:** `../src/components/cv/README.md` — CV-specific component system.
- **Build Scripts:** `../scripts/README.md` — content creation CLI, version sync, update-post.
- **Shared Utilities:** `../src/scripts/` — includes `duration.ts` (timeline duration analysis), `randomImage.ts` (Fisher-Yates image picker), and `collections.ts` (shared path/RSS helpers).
- **Site Constants:** `../src/consts.ts` — centralized SITE_TITLE, SITE_DESCRIPTION, SITE_AUTHOR, CDN URLs, and SOCIAL_LINKS.
