# Repository Guidelines

## Overview
Astro 5 static site (blog/portfolio) with MDX content collections, React islands, Tailwind CSS v4, and Pagefind search. Deployed to Cloudflare Workers (static assets) and optionally GitHub Pages. Runtime is Bun.

## Project Structure
```
src/
  components/     PascalCase .astro and .tsx files; ui/ has shadcn components
  content/        MDX content collections (muses, short_form, long_form, zeitweilig, authors, cv)
  content.config.ts   Zod schemas for all collections
  consts.ts       Site-wide constants (title, author, CDN URLs, social links)
  index.ts        Cloudflare Workers asset entry point
  layouts/        PascalCase .astro layout files
  pages/          File-based routing; each collection has detail/RSS/tag routes
  scripts/        camelCase helpers (collections.ts, theme.ts, utils.ts, etc.)
  styles/         global.css (Tailwind entry point)
public/           Static assets (served as-is)
scripts/          Node build scripts (create-content, update-post, sync-readme-versions)
```

Content files: `YYYY-MM-DD-slug.mdx` inside collection folders. Files prefixed with `_` are drafts (excluded by glob loader). Frontmatter is validated against Zod schemas in `content.config.ts`.

## Build, Test, and Development Commands
```sh
bun install                    # Install dependencies (lockfile: bun.lock)
bun run dev                    # Dev server with HMR (alias: bun run start)
bun run build                  # Production build (runs prebuild + postbuild/pagefind)
bun run preview                # Preview built output from dist/
bun run build:github-pages     # Build with GITHUB_PAGES=true base path

# Linting (requires a build in dist/ first)
bun run lint:html              # html-validate on dist/**/*.html
bun run lint:links             # hyperlink checker on dist/index.html (skip external)
bun run lint:site              # Full pipeline: build + lint:html + lint:links

# Content tooling
bun run create                 # Interactive new content entry wizard
bun run update-post            # Update frontmatter (supports --dry-run)

# Formatting
bun x prettier --write .       # Format all files
bun x prettier --check .       # Check formatting without writing

# Pagefind (runs automatically in postbuild)
bun run postbuild              # Re-index search without rebuilding
```

There is **no unit test suite**. The quality gate is `bun run lint:site` (build + HTML validation + link checking). Run it before opening PRs.

## Code Style & Formatting

### Prettier
Configured in `.prettierrc.mjs`. Uses `prettier-plugin-astro` for `.astro` files. Defaults: 2-space indent, no tabs, double quotes (Prettier default). Run `bun x prettier --write .` before committing.

### TypeScript
- `tsconfig.json` extends `astro/tsconfigs/base` with `strictNullChecks: true`
- JSX configured as `react-jsx` with `jsxImportSource: "react"`
- Use `satisfies` for type-safe object literals (see `src/index.ts`)
- Use optional chaining and nullish coalescing for defensive access
- Define interfaces/types near usage; shared types go in the relevant module (e.g., `CollectionName` in `collections.ts`)

### Imports
- Use ES module imports exclusively (`"type": "module"` in package.json)
- Astro-specific: `import { ... } from "astro:content"` for collection APIs
- Group imports: external packages first, then internal modules (`../consts`, `../scripts/...`)
- Use `import { type Foo }` syntax for type-only imports from value modules
- Use `@/` path aliases for shadcn components (`@/components`, `@/lib/utils`)

### Naming Conventions
| Kind | Convention | Example |
|------|-----------|---------|
| Components (.astro, .tsx) | PascalCase | `BlogPost.astro`, `Hamburger.tsx` |
| Layouts | PascalCase | `BaseLayout.astro` |
| Utility modules | camelCase | `sortByDate.ts`, `collections.ts` |
| Content files | `YYYY-MM-DD-slug.mdx` | `2025-01-15-my-post.mdx` |
| Constants | UPPER_SNAKE_CASE | `SITE_TITLE`, `CDN_FAVICON_URL` |
| Functions/variables | camelCase | `buildDetailPaths`, `sortByDate` |
| Types/Interfaces | PascalCase | `CollectionPost`, `CollectionName` |
| CSS classes | Tailwind utilities | Prefer utilities; shared rules in `src/styles/` |

### Component Patterns
- **Astro components** (.astro): server-rendered by default; preferred for static content
- **React islands** (.tsx): only for client-side interactivity; use `"use client"` directive; add `client:load` or `client:visible` in the parent .astro file
- Default exports are used for React components (Astro convention); named exports for utilities
- Use `useCallback`/`useEffect` cleanup patterns for DOM event listeners in React islands
- shadcn/ui components live in `src/components/ui/`; use `cn()` from `src/components/ui/utils.ts` for class merging

### Tailwind CSS
- v4 with `@tailwindcss/vite` plugin; config in `tailwind.config.mjs` referenced via `@config` in `global.css`
- Dark mode uses `class` strategy
- Custom breakpoints: sm=800px, md=1200px, lg=1900px, xl=2500px, 2xl=3800px (NOT default Tailwind breakpoints)
- Font families: `font-inconsolata`, `font-overpass-mono` (both monospace)
- Typography plugin loaded via `require()` (NOT ESM import) to keep prose in `@layer utilities`
- Prefer utility classes; extract shared patterns to `src/styles/`

### Error Handling
- Use optional chaining (`?.`) and nullish coalescing (`??`) for nullable data
- Content entries may have optional fields; always guard access (see `sortByDate.ts` pattern)
- React islands: add runtime guards for DOM APIs (getElementById may return null)
- Cloudflare Worker entry is minimal; errors propagate through the asset handler

## Content Collections
Six collections defined in `content.config.ts`: muses, short_form, long_form, zeitweilig, authors, cv. All share a `baseSchema` (title, tags, author, description, image?, pubDate, updatedDate?). The cv collection extends it with professional fields.

Shared route helpers in `src/scripts/collections.ts`:
- `buildDetailPaths()` — generates `[...id]` static paths
- `buildTagPaths()` — generates `tags/[tag]` static paths
- `generateRss()` — creates RSS feed for a collection

## Commit & PR Guidelines
- **Conventional Commits**: `fix:`, `feat:`, `chore:`, `docs:`, `perf:` prefixes
- Subject line: imperative voice, max 72 characters
- Separate content-only changes from code changes
- Never commit `dist/`, generated Pagefind assets, or `.env` files
- PRs should include: what/why summary, commands run, linked issue, screenshots for UI changes

## Deployment
- **Cloudflare Workers**: static asset serving via `wrangler.jsonc`; entry at `src/index.ts`
- **GitHub Pages**: set `GITHUB_PAGES=true` during build for correct base path
- **Docker**: `caddy:2.9.1-alpine` base image (see `Dockerfile`)
- Pagefind indexes `dist/` after build; runs automatically via `postbuild` script
- Secrets belong in platform environment variables; never commit `.env`
