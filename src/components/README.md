# Astro Components

### Refer to [Astro docs on Components](https://docs.astro.build/en/basics/astro-components/)

---

## Overview

This project uses Astro v5.17.2 with enhanced component features and Tailwind CSS v4.1.17 for styling. Components leverage the latest Astro features for improved performance and type safety.

## Key Components

### Page & Layout Components

- **[BlogPost.astro](BlogPost.astro)**: Core layout component for all content pages including [short form](https://www.erfianugrah.com/short_form/), [long form](https://www.erfianugrah.com/long_form/), and [tag pages](https://www.erfianugrah.com/long_form/tags/gleichgesinnte/).

- **[Homepage.astro](Homepage.astro)**: Used in [index.astro](../pages/index.astro) to create the landing page. References [homePage.ts](../scripts/homePage.ts) for randomizing featured images.

### Header Components

- **[Header.astro](Header.astro)**: Main header component that incorporates:
  - **[Hamburger.tsx](Hamburger.tsx)**: Mobile menu toggle (`client:idle`)
  - **[ThemeToggle.astro](ThemeToggle.astro)**: Light/dark mode switcher wrapping the React ThemeToggle component (`client:idle`)
  - **[Navigation.astro](Navigation.astro)**: Site navigation menu
  - **[Pagefind.astro](Pagefind.astro)**: Search functionality using [Pagefind](https://pagefind.app/) integration

- **[Footer.astro](Footer.astro)**: Site footer with social media icons from [astro-icon](../../package.json)

### Content Presentation Components

- **[Masonry.astro](Masonry.astro)**: Photo gallery with CSS Grid masonry layout. Accepts per-image `positionx`/`positiony` focal point overrides (same pattern as hero images). Smart default crop at `center 25%` for portrait photography. Uses [MasonryLayout.css](../styles/MasonryLayout.css) with `@supports` progressive enhancement for native CSS masonry. Integrates with [lightbox.ts](../scripts/lightbox.ts) for fullscreen viewing with multi-level zoom and drag/pan.

- **[getRandomImage.astro](getRandomImage.astro)**: Used in [TagLayout.astro](../layouts/TagLayout.astro) to randomize featured images from content collections.

### Typography Components

- **[Prose.astro](Prose.astro)**: [TailwindCSS](../../tailwind.config.mjs) typographic layout used throughout the site for consistent text formatting.
- **[Prose_cv.astro](Prose_cv.astro)**: Specialized version for the [CV](../content/cv) collection.
- **[Prose_headings.astro](Prose_headings.astro)**: Specialized component for formatting headings.

### Utility Components

- **[sortbydate.tsx](sortbydate.tsx)**: Used in [Pages](../pages/) to chronologically order posts rendered by [BlogPost.astro](BlogPost.astro).

## Component Relationships

Components are organized in a hierarchical structure, with layout components (like BaseLayout and MarkdownPostLayout) wrapping content components. The `<slot />` element is used extensively to inject content from Markdown files in the content collections.

## Notes

- All components follow Astro's `.astro` file format with a mix of frontmatter, HTML templates, and component script sections
- Components leverage Astro's optimized rendering for minimal client-side JavaScript
- All styling uses Tailwind CSS v4.1.17 utilities for consistency and performance

## Removed Components

The following were removed during the code quality refactoring:

- `Greeting.jsx` — unused React greeting component
- `Search.astro` — superseded by Pagefind integration
- `Social.astro` / `HomepageMasonry.astro` — dead code, no references
- `fslightbox.js` — vendored lightbox, replaced by custom `lightbox.ts`
- GLightbox CSS/JS — replaced by custom lightbox (73 KB → ~2.4 KB gzipped)
