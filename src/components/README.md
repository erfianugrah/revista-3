# Astro Components

### Refer to [Astro docs on Components](https://docs.astro.build/en/basics/astro-components/)

---

## Overview

Components are the reusable building blocks of the site. All are Astro `.astro` files -- zero JS by default, with a few vanilla islands whose inline `<script>` blocks wire DOM inside `astro:page-load` handlers so they survive ClientRouter view-transition swaps.

## Key Components

### Page & Layout Components

- **[BlogPost.astro](BlogPost.astro)**: Core card component for rendering post previews across [short form](https://www.erfianugrah.com/short_form/), [long form](https://www.erfianugrah.com/long_form/), and [tag pages](https://www.erfianugrah.com/long_form/tags/gleichgesinnte/).

- **[Homepage.astro](Homepage.astro)**: Landing page component used in [index.astro](../pages/index.astro). References [homePage.ts](../scripts/homePage.ts) for randomizing featured images via Fisher-Yates shuffle.

- **[HeroImage.astro](HeroImage.astro)**: Vanilla parallax hero image on content pages. Uses a `<picture>` element with `<source>` for responsive image delivery; the `<img>` carries real alt text (no separate sr-only element). An `IntersectionObserver` ensures the parallax scroll handler only runs while visible, and `will-change: transform` keeps it on the compositor. Supports per-image `positionX`/`positionY` focal point overrides and absolute tag links with collection awareness. The `-20%`/`120%` oversized inner div gives headroom for the parallax offset. All hooks re-wire on `astro:page-load`.

- **[NextPost.astro](NextPost.astro)**: Related content suggestion shown at the bottom of posts. Picks a random post from the same collection (excluding the current one) and renders it as a linked preview card. For posts without a hero image, the favicon placeholder is fetched as PNG (not AVIF) because the SVT-AV1 4:2:0 encoder drops the alpha plane, turning the transparent logo into a solid black square.

### Header Components

- **[Header.astro](Header.astro)**: Main header, incorporates:
  - **[Hamburger.astro](Hamburger.astro)**: Mobile menu toggle. Uses CSS transitions (no framer-motion). Includes `aria-expanded`, `aria-controls`, Escape key handler, and click-outside-to-close for accessibility. All hooks re-wire on `astro:page-load`.
  - **[ThemeToggle.astro](ThemeToggle.astro)**: Self-contained light/dark mode switcher with inline SVG sun/moon. CSS drives dark-state visuals; `theme-toggle` custom event is dispatched on click; [theme.ts](../scripts/theme.ts) handles the actual class toggle and localStorage persistence. All hooks re-wire on `astro:page-load`.
  - **[Navigation.astro](Navigation.astro)**: Site navigation menu with `aria-label` attributes
  - **[Pagefind.astro](Pagefind.astro)**: Search functionality using the raw [Pagefind JS API](https://pagefind.app/docs/api/). Renders a custom `<dialog>` modal with debounced search, result cards, and thumbnail images. The search icon trigger button is placed in `Header.astro`. Reinitializes via `astro:page-load` for ClientRouter compatibility. Uses `AbortController` for event listener cleanup across navigations.

- **[Footer.astro](Footer.astro)**: Site footer with social media icons from [astro-icon](../../package.json)

### Content Presentation Components

- **[Masonry.astro](Masonry.astro)**: Photo gallery with CSS Grid masonry layout. Accepts per-image `positionx`/`positiony` focal point overrides (same pattern as hero images). Smart default crop at `center 25%` for portrait photography. Uses [MasonryLayout.css](../styles/MasonryLayout.css) with `@supports` progressive enhancement for native CSS masonry. Integrates with [lightbox.ts](../scripts/lightbox.ts) (via `lightbox-link` class on gallery links) for fullscreen viewing with multi-level zoom and drag/pan.

- **[GetRandomImage.astro](GetRandomImage.astro)**: Used in [TagLayout.astro](../layouts/TagLayout.astro) to randomize featured images from content collections. Includes a `<noscript>` fallback for non-JS users.

### Typography Components

- **[Prose.astro](Prose.astro)**: Tailwind CSS typographic layout used throughout the site for consistent text formatting.
- **[ProseCv.astro](ProseCv.astro)**: Specialized version for the [CV](../content/cv) collection. Uses runtime JS (wired on `astro:page-load`) to add `.company-section`, `.job-section`, `.education-section`, and `.skills-list` classes for print-friendly formatting.
- **[ProseHeadings.astro](ProseHeadings.astro)**: Specialized component for formatting headings.

### Utility Components

- **[sortByDate.ts](sortByDate.ts)**: Used in [Pages](../pages/) to chronologically order posts rendered by [BlogPost.astro](BlogPost.astro).

- **[ScrollToTop.astro](ScrollToTop.astro)**: Vanilla "back to top" button. Uses `requestAnimationFrame` throttling on the scroll listener for performance, and smooth scrolling via `window.scrollTo`. Transparent background with inherited-colour chevron. All hooks re-wire on `astro:page-load`.

### UI Primitives

The `ui/` directory is empty -- shadcn/ui was removed during the React removal refactor. Tailwind utility classes are applied directly in `.astro` components instead.

### CV Components

The `cv/` subdirectory contains specialized components for the resume page. See [cv/README.md](cv/README.md) for details:

- `Company.astro`, `Contact.astro`, `EducationTimeline.astro`, `Section.astro`, `SkillBar.astro`, `Timeline.astro`, `ColorLegend.astro`

## Component Relationships

Components follow a hierarchical structure, with layout components (BaseLayout, MarkdownPostLayout) wrapping content components. `<slot />` injects content from MDX files in the content collections.

## Notes

- All components follow Astro's `.astro` file format with a mix of frontmatter, HTML templates, and component script sections
- Interactive islands use vanilla inline scripts wired inside `astro:page-load` handlers with cleanup closures for ClientRouter compatibility
- Styling uses Tailwind CSS v4 utilities

### Type Safety

Several components carry inline type declarations to satisfy `astro check` without adding external `@types/*` packages:

- **Header.astro**: Image `width`/`height` props use numeric literals (`60`) instead of strings to match Astro's `ImageMetadata` types. The favicon is fetched at 60x60 for appropriate display size.
- **Masonry.astro**: Avoids `key` props on native HTML elements (unlike React, Astro templates don't support `key` on non-component elements).
- **NextPost.astro**: Uses a `CollectionName` type (from `collections.ts`) for the collection prop, a `PostData` interface for frontmatter fields, and typed `getImage()` parameters.
- **Pagefind.astro**: Uses a native `<dialog>` element with the raw Pagefind JS API (`/pagefind/pagefind.js`). The API is lazy-loaded via dynamic `import()` on first search and cached. The search logic lives in `src/scripts/pagefind.ts` (referenced via `<script src>`); it must stay a build-emitted chunk, not an inlined script - see the `assetsInlineLimit` note in `astro.config.mjs`. The `setup()` function runs on every `astro:page-load` to rebind DOM queries and event listeners after ClientRouter navigations. Dark mode is handled via `.dark` CSS selectors.

## Shared Utilities

Several components share logic extracted into `src/scripts/`:

- **[duration.ts](../scripts/duration.ts)**: `analyzeDuration()` — computes month counts and duration categories for timeline visualizations. Used by `cv/Timeline.astro` and `cv/EducationTimeline.astro`.
- **[randomImage.ts](../scripts/randomImage.ts)**: Fisher-Yates shuffle and random image picker logic. Used by `homePage.ts` and `getRandomImage.ts` (renamed from `getrandomimage.ts`).
- **[consts.ts](../consts.ts)**: Site-wide constants (title, author, CDN URLs, social links) imported by Header, Footer, BaseLayout, NextPost, and collections.ts.

## Removed Components

The following were removed during the code quality refactoring:

- `Greeting.jsx` - unused React greeting component
- `Search.astro` - superseded by Pagefind integration
- `Social.astro` / `HomepageMasonry.astro` - dead code, no references
- `fslightbox.js` - vendored lightbox, replaced by custom `lightbox.ts`
- GLightbox CSS/JS - replaced by custom lightbox (73 KB -> ~3.4 KB gzipped)
- `FormattedDate.astro` - date formatting now handled inline via `formatDate()` from `utils.ts`
- `framer-motion` - removed as dependency; Hamburger.astro and ThemeToggle.astro now use pure CSS transitions
