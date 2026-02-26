# Astro Components

### Refer to [Astro docs on Components](https://docs.astro.build/en/basics/astro-components/)

---

## Overview

Components are the reusable building blocks of the site. Most are Astro `.astro` files (zero JS by default), with a few React `.tsx` islands for interactive bits that need client-side state.

## Key Components

### Page & Layout Components

- **[BlogPost.astro](BlogPost.astro)**: Core card component for rendering post previews across [short form](https://www.erfianugrah.com/short_form/), [long form](https://www.erfianugrah.com/long_form/), and [tag pages](https://www.erfianugrah.com/long_form/tags/gleichgesinnte/).

- **[Homepage.astro](Homepage.astro)**: Landing page component used in [index.astro](../pages/index.astro). References [homePage.ts](../scripts/homePage.ts) for randomizing featured images via Fisher-Yates shuffle.

- **[HeroImage.tsx](HeroImage.tsx)**: React island (`client:load`) for the parallax hero image on content pages. Uses a `<picture>` element with `<source>` for responsive image delivery. An `IntersectionObserver` ensures the parallax scroll handler only runs while visible, and `will-change: transform` keeps it on the compositor. Supports per-image `positionX`/`positionY` focal point overrides and absolute tag links with collection awareness. The `-20%`/`120%` oversized inner div gives headroom for the parallax offset.

- **[NextPost.astro](NextPost.astro)**: Related content suggestion shown at the bottom of posts. Picks a random post from the same collection (excluding the current one) and renders it as a linked preview card.

### Header Components

- **[Header.astro](Header.astro)**: Main header, incorporates:
  - **[Hamburger.tsx](Hamburger.tsx)**: Mobile menu toggle (`client:idle`). Uses CSS transitions (no framer-motion). Includes `aria-expanded`, `aria-controls`, Escape key handler, and click-outside-to-close for accessibility.
  - **[ThemeToggle.astro](ThemeToggle.astro)**: Light/dark mode switcher wrapping the React [ThemeToggle.tsx](ThemeToggle.tsx) component (`client:idle`). The React component uses CSS transitions for sun/moon animations and dispatches a `theme-toggle` custom event; [theme.ts](../scripts/theme.ts) handles the actual class toggle and localStorage persistence.
  - **[Navigation.astro](Navigation.astro)**: Site navigation menu with `role="menu"` and `aria-label` attributes
  - **[Pagefind.astro](Pagefind.astro)**: Search functionality using [Pagefind](https://pagefind.app/), implemented as a native `<dialog>` element

- **[Footer.astro](Footer.astro)**: Site footer with social media icons from [astro-icon](../../package.json)

### Content Presentation Components

- **[Masonry.astro](Masonry.astro)**: Photo gallery with CSS Grid masonry layout. Accepts per-image `positionx`/`positiony` focal point overrides (same pattern as hero images). Smart default crop at `center 25%` for portrait photography. Uses [MasonryLayout.css](../styles/MasonryLayout.css) with `@supports` progressive enhancement for native CSS masonry. Integrates with [lightbox.ts](../scripts/lightbox.ts) for fullscreen viewing with multi-level zoom and drag/pan.

- **[GetRandomImage.astro](GetRandomImage.astro)**: Used in [TagLayout.astro](../layouts/TagLayout.astro) to randomize featured images from content collections. Includes a `<noscript>` fallback for non-JS users.

- **[FormattedDate.astro](FormattedDate.astro)**: Renders a `<time>` element with a formatted date string and a machine-readable `datetime` attribute.

### Typography Components

- **[Prose.astro](Prose.astro)**: [TailwindCSS](../../tailwind.config.mjs) typographic layout used throughout the site for consistent text formatting.
- **[ProseCv.astro](ProseCv.astro)**: Specialized version for the [CV](../content/cv) collection. Uses runtime JS to add a `.skills-list` class (replacing the unsupported `:contains()` pseudo-class) and listens for `astro:page-load` for View Transitions compatibility.
- **[ProseHeadings.astro](ProseHeadings.astro)**: Specialized component for formatting headings.

### Utility Components

- **[sortByDate.ts](sortByDate.ts)**: Used in [Pages](../pages/) to chronologically order posts rendered by [BlogPost.astro](BlogPost.astro). (Pure TypeScript — no JSX, so the file uses `.ts` rather than `.tsx`.)

- **[ScrollToTop.tsx](ScrollToTop.tsx)**: React island for the "back to top" button. Uses `requestAnimationFrame` throttling on the scroll listener for performance, and smooth scrolling via `window.scrollTo`.

### UI Primitives

- **[ui/button.tsx](ui/button.tsx)**: Shared button component built with `class-variance-authority` for consistent styling variants.
- **[ui/utils.ts](ui/utils.ts)**: `cn()` utility for merging Tailwind classes (wraps `clsx` + `tailwind-merge`).

### CV Components

The `cv/` subdirectory contains specialized components for the resume page. See [cv/README.md](cv/README.md) for details:

- `Company.astro`, `Contact.astro`, `EducationTimeline.astro`, `Section.astro`, `SkillBar.astro`, `Timeline.astro`, `ColorLegend.astro`

## Component Relationships

Components follow a hierarchical structure, with layout components (BaseLayout, MarkdownPostLayout) wrapping content components. `<slot />` injects content from MDX files in the content collections.

## Notes

- All components follow Astro's `.astro` file format with a mix of frontmatter, HTML templates, and component script sections
- React islands use `client:idle` unless they need to be visible immediately (HeroImage uses `client:load`)
- Styling uses Tailwind CSS v4 utilities

### Type Safety

Several components carry inline type declarations to satisfy `astro check` without adding external `@types/*` packages:

- **Header.astro**: Image `width`/`height` props use numeric literals (`60`) instead of strings to match Astro's `ImageMetadata` types. The favicon is fetched at 60x60 for appropriate display size.
- **Masonry.astro**: Avoids `key` props on native HTML elements (unlike React, Astro templates don't support `key` on non-component elements).
- **NextPost.astro**: Uses a `CollectionName` type (from `collections.ts`) for the collection prop, a `PostData` interface for frontmatter fields, and typed `getImage()` parameters.
- **Pagefind.astro**: Uses a native `<dialog>` element for the search modal. Declares `PagefindUI` as a class in the inline script, and uses optional chaining on all DOM queries to handle nullable elements safely.

## Shared Utilities

Several components share logic extracted into `src/scripts/`:

- **[duration.ts](../scripts/duration.ts)**: `analyzeDuration()` — computes month counts and duration categories for timeline visualizations. Used by `cv/Timeline.astro` and `cv/EducationTimeline.astro`.
- **[randomImage.ts](../scripts/randomImage.ts)**: Fisher-Yates shuffle and random image picker logic. Used by `homePage.ts` and `getrandomimage.ts`.
- **[consts.ts](../consts.ts)**: Site-wide constants (title, author, CDN URLs, social links) imported by Header, Footer, BaseLayout, NextPost, and collections.ts.

## Removed Components

The following were removed during the code quality refactoring:

- `Greeting.jsx` - unused React greeting component
- `Search.astro` - superseded by Pagefind integration
- `Social.astro` / `HomepageMasonry.astro` - dead code, no references
- `fslightbox.js` - vendored lightbox, replaced by custom `lightbox.ts`
- GLightbox CSS/JS - replaced by custom lightbox (73 KB -> ~2.4 KB gzipped)
- `framer-motion` - removed as dependency; Hamburger.tsx and ThemeToggle.tsx now use pure CSS transitions
