# Codebase Review Fixes (Round 2)

Tracking fixes from the codebase review. Each item links to the original finding.

## High Priority

- [x] **og:type hardcoded to `website`** — `BaseLayout.astro:134` now uses `article` when `pubDate` is present
- [x] **theme.ts unsafe localStorage** — `theme.ts` now validates stored value at runtime and wraps both `getItem`/`setItem` in try/catch
- [x] **lightbox.ts double-fire** — `lightbox.ts` now uses a `faded` sentinel guard to prevent `onFaded` executing twice

## Medium Priority

- [x] **Dead code removal** — deleted `remark-modified-time.mjs` (unused), removed `.nav-search` CSS from `Navigation.astro`, removed unused `company` prop from `Timeline.astro`
- [x] **RSS items unsorted** — `collections.ts` now sorts items by `pubDate` descending before mapping to RSS
- [x] **Empty `<p>` in authors detail** — removed empty reading-time paragraph from `authors/[...id].astro`
- [x] **`collectionSlug` unused in tag pages** — all 5 `[tag].astro` files now destructure and use `collectionSlug` for URLs and improved `<title>` (e.g., "muses — photography")
- [x] **Accessibility: SkillBar ARIA** — added `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` to `cv/SkillBar.astro`
- [x] **Accessibility: Pagefind dialog hint** — added `aria-haspopup="dialog"` to search button in `Pagefind.astro`

## Low Priority

- [x] **Redundant `box-sizing`** — removed duplicate `* { box-sizing: border-box }` from `global.css` (Tailwind preflight covers this)
- [x] **Duplicate `encode` in Caddyfile** — removed duplicate `encode zstd gzip` directive

## Also Fixed

- [x] **package.json version mismatch** — bumped from `6.1.0` to `6.1.1` to match existing `v6.1.1` git tag (was causing Version Consistency CI failure)
