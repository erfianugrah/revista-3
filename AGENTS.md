# Repository Guidelines

## Overview

Revista is an Astro 7 static site for photography, writing, and CV content.
It uses MDX content collections, vanilla Astro components with inline scripts for interactivity, Tailwind CSS v4, and Pagefind search.
Primary runtime and package manager: Bun. Some helper scripts still run through Node.

## Rule Sources

- This `AGENTS.md` is the only agent-instruction file currently present in the repo.
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` files were found during inspection.
- If any of those files are added later, merge their instructions into this document.

## Project Map

```text
src/
  components/       Astro components; `ui/` is empty (shadcn removed post-refactor)
  config/           Route and collection configuration (collections.ts)
  content/          MDX content collections: muses, short_form, long_form, zeitweilig, authors, cv
  content.config.ts Zod-backed collection schemas and glob loaders
  consts.ts         Site constants, metadata, CDN URLs, social links
  index.ts          Cloudflare Workers asset entry point
  layouts/          Shared Astro layouts
  pages/            File-based routes plus dynamic collection/tag pages
  scripts/          Client/build helpers such as collections, theme, lightbox, utils
  styles/           Global and shared CSS
public/             Static assets served as-is
scripts/            Node CLI/content maintenance scripts
dist/               Generated output; do not edit by hand
```

## Build, Lint, Test, and Dev Commands

Use Bun by default.

```sh
bun install                    # install dependencies
bun run dev                    # Astro dev server
bun run start                  # alias for dev
bun run build                  # production build; also runs prebuild + postbuild hooks
bun run preview                # preview built site from dist/
bun run prebuild               # sync README/doc version badges
bun run postbuild              # run Pagefind over dist/ only
bun run lint:html              # validate generated HTML in dist/
bun run lint:links             # check internal links from dist/index.html
bun run lint:site              # full quality gate: build + html + links
bun x astro check              # project-wide Astro/type/content validation
bun x prettier --check .       # formatting check
bun x prettier --write .       # format entire repo
bun run create                 # interactive content creation wizard
bun run update-post            # update content frontmatter
node scripts/parser.js         # verify CLI/content schema drift
```

## Single-Test / Targeted Verification

The repository has a Playwright end-to-end test suite (103 tests across 15 spec files).

```sh
bunx playwright test                                    # run full test suite
bunx playwright test tests/spec-name.spec.ts            # run a single spec file
bunx playwright test -g "test name pattern"             # run tests matching a pattern
bun x astro check                                       # quickest project-wide type/content check
bun x prettier --check src/path/to/file.astro           # single-file formatting check
bun x html-validate dist/path/to/page.html              # validate one generated page
bun x hyperlink dist/path/to/page.html --skip-external
```

- Content-only or markup edits: start with the narrowest command.
- Layout, routing, or build changes: prefer `bun run lint:site` before handoff.
- Component or script changes: run relevant Playwright specs to verify behavior.

## Build Pipeline Facts

- `bun run build` triggers `prebuild` automatically via package scripts.
- `prebuild` runs `scripts/sync-readme-versions.js`.
- `postbuild` runs `pagefind --site dist` automatically after a successful build.
- `lint:html` and `lint:links` require built files in `dist/`.
- `.htmlvalidate.json` = recommended rules minus `no-inline-style` (dynamic style values in hamburger, hero and random-post cards) and `void-style` (`<hr/>` spelling). `lint:links` passes `--canonicalroot` so the site's own absolute URLs (og:image) resolve to `dist/` instead of production, where an undeployed image hash 404s. Both gates passed for the first time on 2026-10-26 (revista-3#1); before that lint:html failed with 1164 errors and lint:links never ran.
- Build concurrency is set to 4 in `astro.config.mjs` to avoid rate-limiting `image.erfi.io`.
- `vite.build.assetsInlineLimit` in `astro.config.mjs` vetoes script inlining (returns `false` for `.js`). Astro's plugin-scripts inlines small hoisted script chunks into the HTML, but the inlined copy keeps Vite's raw `__VITE_PRELOAD__` marker (ReferenceError at runtime) when the chunk wraps a dynamic import in `__vitePreload()`. This broke the lazy `/pagefind/pagefind.js` import (search dialog opened, every query showed "Search unavailable"). Scripts must always emit as chunks; do not remove the veto.

## Remote Image Handling

- Remote images from `image.erfi.io` are downloaded and transformed during production builds.
- Astro caches processed images in `node_modules/.astro/assets/`; a warm cache avoids re-downloading.
- `src/scripts/undici-retry.ts` configures a global `RetryAgent` for build-time HTTP fetches with exponential backoff (5 retries, 1s-60s), 120s body timeout, and 6 max connections.
- The Dockerfile is a bare BusyBox httpd image that copies a pre-built `dist/`; it runs no image processing itself. The Astro image cache only matters for the `bun run build` step (local or CI).
- CI caches the Astro image directory separately from `node_modules` to survive dependency updates.
- If remote image builds fail in CI, check rate limits on the CDN and verify the Astro image cache is warm.

## Image Service (@erfianugrah/astro-image-hq)

- Production builds use the [`@erfianugrah/astro-image-hq`](https://www.npmjs.com/package/@erfianugrah/astro-image-hq) custom Astro image service (configured in `astro.config.mjs`).
- Profile is `photo`: hybrid routing - 4:2:0 10-bit fast path (NVENC > avifenc-svt > sharp) for typical content, with content-aware shadow boost promoting dark gradient images to 4:4:4 10-bit aom.
- Routing guards (since 0.1.x): codec capability detection runs at startup, and per-image constraints can drop the requested codec before encode - SVT-AV1 needs a >=64px smallest side and even dimensions for 4:2:0 (odd dimensions fall back to aom, which handles them internally), NVENC needs >=128px frames (falls back to sharp). Dimensions are re-validated after resize and encode failures retry with the next encoder in the chain.
- Since 0.1.5: alpha-bearing images route off SVT/NVENC to aom to preserve transparency. 4:2:0 AVIF output is clamped to even dimensions (odd-dim AVIFs fail to decode in Firefox). The package version is hashed into `propertiesToHash` so upgrades invalidate consumer image caches.
- Override precedence is **boost-as-floor**: profile defaults → component override (`<Image quality={N} />`) → shadow boost merges last. Bright images take the component value; dark gradients get clamped up by the boost.
- Falls back to sharp 8-bit with a warning when `avifenc` is missing -- local dev still works without it.
- Required system package: `libavif` on Arch, `libavif-bin` on Debian/Ubuntu. CI installs it via apt before `bun install` (see `.github/workflows/deploy.yml`).
- Optional: ffmpeg + `av1_nvenc` for GPU-accelerated AVIF -- produces 4:2:0 only (8-bit or 10-bit); routing skips NVENC when 4:4:4 chroma is requested.
- Source code lives at https://github.com/erfianugrah/astro-image-hq (`~/astro-image-hq` for local development). Bump the `@erfianugrah/astro-image-hq` version in `package.json` then `bun install` to consume releases.
- When running locally without `avifenc`, the build still completes via sharp fallback. Banding may be visible in dark photographs; install `libavif` for the full fix.
- Image transforms cost ~150-500ms via NVENC (GPU), ~1-2s via avifenc-svt (CPU 4:2:0), ~3-5s via avifenc-aom (CPU 4:4:4 boosted). A cold full build takes 5-8 minutes wall clock; a warm `node_modules/.astro/assets/` cache revalidates in seconds.
- Releases use OIDC trusted publishing via tag push (no `NPM_TOKEN`).

## Formatting

- Prettier is the formatting authority; config lives in `.prettierrc.mjs`.
- `prettier-plugin-astro` handles `.astro` files.
- Use 2-space indentation; prefer double quotes unless a file already uses a different local convention.
- Do not reformat unrelated files just because you touched one file.
- Preserve file-local style in vendored or generated-style code.

## Imports

- Use ESM imports only; `package.json` sets `"type": "module"`.
- Group imports as framework/external packages, then internal modules, then styles when relevant.
- Use relative imports; no `@/` path alias is configured in `tsconfig.json`.
- Use `import { type Foo }` when importing types from value modules.
- Follow nearby extension style for local imports instead of mass-normalizing files.
- Common Astro imports include `astro:content`, `astro:assets`, and `astro:transitions`.

## TypeScript and Astro Conventions

- TypeScript strict mode via `tsconfig.json` extending `astro/tsconfigs/base` with `strictNullChecks: true`. No JSX transform is configured -- React has been removed.
- Keep shared types near the module that owns them; export them when reused.
- Use `satisfies` for object literals when it improves safety, as in `src/index.ts`.
- In `.astro` files, define a `Props` interface when the component accepts props.
- Prefer explicit return types for exported helpers when the shape is not obvious.
- Avoid `any`; use unions, interfaces, generics, or Zod-backed data shapes instead.

## Vanilla Island Patterns

- Interactivity is handled by vanilla `.astro` components with inline `<script>` blocks.
- Each script wires DOM inside an `astro:page-load` event handler so it survives ClientRouter view-transition swaps.
- Cleanup closures tear down previous listeners before re-adding, preventing accumulation across navigations.
- The four interactive islands are:
  - **ThemeToggle.astro**: SVG sun/moon toggle; dispatches `theme-toggle` event; CSS drives dark-state visuals; `theme.ts` handles localStorage and the `dark` class.
  - **Hamburger.astro**: Mobile menu toggle with 3-bar-to-X animation, Escape key handler, and click-outside-to-close.
  - **ScrollToTop.astro**: rAF-throttled visibility toggle; smooth `window.scrollTo`; transparent background with inherited-colour chevron.
  - **HeroImage.astro**: Parallax hero with translate3d scroll, IntersectionObserver gate, rAF+lerp loop, fade-in on load, and `prefers-reduced-motion` respect.
- The `scripts/` directory holds shared logic (theme, lightbox, pagefind) as plain TypeScript modules -- no React, no JSX.

## Astro Component Patterns

- Server-rendered `.astro` components are the default choice.
- Use frontmatter for imports, derived values, and async work.
- Keep layouts responsible for document metadata, shared structure, and page-level scripts.
- Reuse existing helpers like `buildDetailPaths()`, `buildTagPaths()`, and `generateRss()` instead of duplicating route logic.
- Prefer extending existing content/layout abstractions over creating parallel page-specific implementations.

## Styling and Tailwind

- Tailwind CSS v4.2.2 is wired through `@tailwindcss/vite` in `astro.config.mjs`.
- All config lives in `src/styles/global.css` as `@theme` blocks, `@plugin` directives, and `@custom-variant` declarations. No separate Tailwind config file exists.
- Dark mode uses `@custom-variant dark (&:where(.dark, .dark *))`.
- Custom breakpoints are defined in the `@theme` block: `sm=800`, `md=1200`, `lg=1900`, `xl=2500`.
- Font families center on `Inconsolata` and `Overpass Mono` (defined as `--font-overpass-mono` and `--font-inconsolata` in `@theme`).
- Prefer utility classes first; add custom CSS only for masonry, lightbox, imported CV styling, or layout edge cases.
- The typography plugin is loaded via `@plugin "@tailwindcss/typography"` in `global.css`. ESM imports work natively with Tailwind v4.2.2 -- the old `require()` workaround is no longer needed.

## Naming Conventions

- Components and layouts use PascalCase (`Header.astro`, `ThemeToggle.astro`, `BaseLayout.astro`).
- Utility modules use camelCase (`sortByDate.ts`, `collections.ts`).
- Constants use UPPER_SNAKE_CASE (`SITE_TITLE`).
- Functions and locals use camelCase; types and interfaces use PascalCase.
- Content files use `YYYY-MM-DD-slug.mdx`.
- Draft content files begin with `_` and are excluded by the glob loaders.

## Content Collection Rules

- Collections are defined in `src/content.config.ts` using Zod schemas and Astro glob loaders.
- Shared frontmatter lives in `baseSchema`; the CV collection extends it with structured resume data.
- Keep collection names consistent across schemas, routes, pages, and CLI scripts.
- If you add or rename a collection, update both `src/content.config.ts` and the helpers in `scripts/`.
- Preserve existing frontmatter formatting unless a tool intentionally rewrites it.
- `src/content/cv/cv-export.html` is imported/generated content; edit it carefully and avoid incidental cleanup.

## Content Tooling

- `bun run create` and `bun run update-post` wrap Node scripts in `scripts/`.
- `node scripts/parser.js` checks schema drift between the CLI tools and `src/content.config.ts`.
- When editing content tooling, verify both the runtime command and the drift checker.

## Error Handling and Defensive Coding

- Use optional chaining and nullish coalescing for nullable content data.
- Guard DOM queries like `getElementById`, `querySelector`, and mutation observers.
- Wrap `localStorage` access in `try/catch`; `src/scripts/theme.ts` is the reference pattern.
- Throw explicit errors for invalid required runtime or build state, for example missing `context.site` for RSS generation.
- Prefer small, explicit runtime guards over deeply nested assumptions.

## Generated and Deployment-Sensitive Files

- Do not commit `dist/`, generated Pagefind output, or `.env` files.
- Cloudflare Worker entrypoint is `src/index.ts`; keep it minimal and edge-safe.
- Wrangler config lives in `wrangler.jsonc`.

## Deployment Notes

- Deployment target is Cloudflare Workers (static assets); a Docker image is built for container hosting. Deploys are atomic and asset URLs are content-hashed, so no cache purge step exists.
- `dist/` is generated output and Pagefind indexes it after a successful build.

## Agent Workflow Recommendations

- Read the nearby file first and follow its established style before editing.
- Prefer the smallest effective change; avoid broad refactors unless the task requires them.
- Run the narrowest relevant verification command after each change.
- Before handoff on substantive code changes, prefer `bun run lint:site` if time permits.
- If you touch content tooling or collection schemas, also run `node scripts/parser.js`.
- Update this file whenever repo conventions, scripts, or rule sources change.
