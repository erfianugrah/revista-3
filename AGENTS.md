# Repository Guidelines

## Overview

Revista is an Astro 6 static site for photography, writing, and CV content.
It uses MDX content collections, a small number of React islands, Tailwind CSS v4, and Pagefind search.
Primary runtime and package manager: Bun. Some helper scripts still run through Node.

## Rule Sources

- This `AGENTS.md` is the only agent-instruction file currently present in the repo.
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` files were found during inspection.
- If any of those files are added later, merge their instructions into this document.

## Project Map

```text
src/
  components/       Astro components plus React islands; `ui/` holds shadcn-style helpers
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
bun run build:github-pages     # GitHub Pages build with /revista-3 base path
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

The repository has a Playwright end-to-end test suite (74 tests across 12 spec files).

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
- `bun run build:github-pages` manually appends Pagefind after an Astro build with `GITHUB_PAGES=true`.
- `lint:html` and `lint:links` require built files in `dist/`.
- Build concurrency is set to 4 in `astro.config.mjs` to avoid rate-limiting `image.erfi.io`.

## Remote Image Handling

- Remote images from `image.erfi.io` are downloaded and transformed during production builds.
- Astro caches processed images in `node_modules/.astro/assets/`; a warm cache avoids re-downloading.
- `src/scripts/undici-retry.ts` configures a global `RetryAgent` for build-time HTTP fetches with exponential backoff (5 retries, 1s-60s), 120s body timeout, and 6 max connections.
- The Dockerfile uses a BuildKit cache mount for `node_modules/.astro/` so the image cache persists across Docker builds.
- CI caches the Astro image directory separately from `node_modules` to survive dependency updates.
- If remote image builds fail in CI, check rate limits on the CDN and verify the Astro image cache is warm.

## Image Service (astro-image-hq)

- Production builds use the `astro-image-hq` custom image service (configured in `astro.config.mjs`).
- Profile is `photo`: 10-bit 4:4:4 AVIF via `avifenc` (libavif CLI) with content-aware shadow boost for dark gradient images.
- Falls back to sharp 8-bit 4:4:4 with a warning when `avifenc` is missing — local dev still works.
- Required system package: `libavif` on Arch, `libavif-bin` on Debian/Ubuntu. The CI runner and Dockerfile must install it before `bun run build`.
- Optional: ffmpeg + `av1_nvenc` for GPU-accelerated AVIF, but it only outputs 4:2:0 8-bit; routing skips NVENC when 4:4:4 or 10-bit is requested.
- Source code lives in sibling repo `~/astro-image-hq` (linked via `bun link` during dev). See `MEDIA_ENCODER.md` for design rationale.
- When running locally without `avifenc`, the build still completes via sharp fallback. Banding will be visible in dark photographs; install `libavif` to get the full fix.
- Image transforms cost ~2-12s each at 10-bit 4:4:4 (avifenc speed 4); a full build of ~150 source images is fetch-bound, not encode-bound.

## Formatting

- Prettier is the formatting authority; config lives in `.prettierrc.mjs`.
- `prettier-plugin-astro` handles `.astro` files.
- Use 2-space indentation; prefer double quotes unless a file already uses a different local convention.
- Do not reformat unrelated files just because you touched one file.
- Preserve file-local style in vendored or generated-style code such as `src/components/ui/button.tsx`.

## Imports

- Use ESM imports only; `package.json` sets `"type": "module"`.
- Group imports as framework/external packages, then internal modules, then styles when relevant.
- Use relative imports; no `@/` path alias is configured in `tsconfig.json`.
- Use `import { type Foo }` when importing types from value modules.
- Follow nearby extension style for local imports instead of mass-normalizing files.
- Common Astro imports include `astro:content`, `astro:assets`, and `astro:transitions`.

## TypeScript and Astro Conventions

- `tsconfig.json` extends `astro/tsconfigs/base` with `strictNullChecks: true`.
- JSX uses `react-jsx` with `jsxImportSource: "react"`.
- Keep shared types near the module that owns them; export them when reused.
- Use `satisfies` for object literals when it improves safety, as in `src/index.ts`.
- In `.astro` files, define a `Props` interface when the component accepts props.
- Prefer explicit return types for exported helpers when the shape is not obvious.
- Avoid `any`; use unions, interfaces, generics, or Zod-backed data shapes instead.

## React Island Patterns

- React is used only for interactive islands such as toggles, menu controls, and scroll helpers.
- Hydration happens from the parent `.astro` file with `client:load`, `client:idle`, or similar directives.
- Do not add Next.js-style `"use client"`; that pattern does not belong in this Astro repo.
- Default exports are the norm for React components in `src/components/*.tsx`.
- Clean up observers and event listeners in `useEffect` return functions.
- Guard browser-only APIs if code may run before the DOM is ready.

## Astro Component Patterns

- Server-rendered `.astro` components are the default choice.
- Use frontmatter for imports, derived values, and async work.
- Keep layouts responsible for document metadata, shared structure, and page-level scripts.
- Reuse existing helpers like `buildDetailPaths()`, `buildTagPaths()`, and `generateRss()` instead of duplicating route logic.
- Prefer extending existing content/layout abstractions over creating parallel page-specific implementations.

## Styling and Tailwind

- Tailwind CSS v4 is wired through `@tailwindcss/vite` in `astro.config.mjs`.
- Global entrypoint is `src/styles/global.css` and it references `tailwind.config.mjs` with `@config`.
- Dark mode uses the `class` strategy.
- Custom breakpoints are not Tailwind defaults: `sm=800`, `md=1200`, `lg=1900`, `xl=2500`, `2xl=3800`.
- Font families center on `Inconsolata` and `Overpass Mono`.
- Prefer utility classes first; add custom CSS only for masonry, lightbox, imported CV styling, or layout edge cases.
- The typography plugin is loaded with `require()` intentionally; do not convert it to ESM import without rechecking the setup.

## Naming Conventions

- Components and layouts use PascalCase (`Header.astro`, `ThemeToggle.tsx`, `BaseLayout.astro`).
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
- GitHub Pages behavior is controlled by `GITHUB_PAGES=true` during build.
- Wrangler config lives in `wrangler.jsonc`.

## Deployment Notes

- Primary deployment target is Cloudflare Workers/static assets; GitHub Pages is an alternate target.
- `GITHUB_PAGES=true` changes the `site` and `base` values in `astro.config.mjs`.
- `dist/` is generated output and Pagefind indexes it after a successful build.

## Agent Workflow Recommendations

- Read the nearby file first and follow its established style before editing.
- Prefer the smallest effective change; avoid broad refactors unless the task requires them.
- Run the narrowest relevant verification command after each change.
- Before handoff on substantive code changes, prefer `bun run lint:site` if time permits.
- If you touch content tooling or collection schemas, also run `node scripts/parser.js`.
- Update this file whenever repo conventions, scripts, or rule sources change.
