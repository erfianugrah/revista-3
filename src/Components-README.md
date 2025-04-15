# Astro Components

### Refer to [Astro docs on Components](https://docs.astro.build/en/basics/astro-components/)
---

## Overview

This project uses Astro v5.7.0 with enhanced component features and Tailwind CSS v4.0.8 for styling. Components leverage the latest Astro features for improved performance and type safety.

## Key Components

### Page & Layout Components

- **[BlogPost.astro](components/BlogPost.astro)**: Core layout component for all content pages including [short form](https://www.erfianugrah.com/short_form/), [long form](https://www.erfianugrah.com/long_form/), and [tag pages](https://www.erfianugrah.com/long_form/tags/gleichgesinnte/).

- **[Homepage.astro](components/Homepage.astro)**: Used in [index.astro](pages/index.astro) to create the landing page. References [homepage.js](scripts/homePage.js) for randomizing featured images.

### Header Components

- **[Header.astro](components/Header.astro)**: Main header component that incorporates:
  - **[Hamburger.astro](components/Hamburger.astro)**: Mobile menu toggle
  - **[ThemeToggle.astro](components/ThemeToggle.astro)**: Light/dark mode switcher that wraps the React-based ThemeToggle component
  - **[Navigation.astro](components/Navigation.astro)**: Site navigation menu
  - **[Pagefind.astro](components/Pagefind.astro)**: Search functionality using [Pagefind](https://pagefind.app/) integration

- **[Footer.astro](components/Footer.astro)**: Site footer with social media icons from [astro-icon](../package.json)

### Content Presentation Components

- **[Masonry.astro](components/Masonry.astro)**: Photo gallery layout used in [MarkdownPostLayout.astro](layouts/MarkdownPostLayout.astro) to display images from [Content Collections](content/). Uses [masonry.css](styles/MasonryLayout.css) and [glightbox.js](scripts/lightbox.js) for the gallery lightbox functionality.

- **[getRandomImage.astro](components/getRandomImage.astro)**: Used in [TagLayout.astro](layouts/TagLayout.astro) to randomize featured images from content collections.

### Typography Components

- **[Prose.astro](components/Prose.astro)**: [TailwindCSS](../tailwind.config.mjs) typographic layout used throughout the site for consistent text formatting.
- **[Prose_cv.astro](components/Prose_cv.astro)**: Specialized version for the [CV](content/cv) collection.
- **[Prose_headings.astro](components/Prose_headings.astro)**: Specialized component for formatting headings.

### Utility Components

- **[sortbydate.jsx](components/sortbydate.jsx)**: Used in [Pages](pages/) to chronologically order posts rendered by [BlogPost.astro](layouts/BlogPost.astro).

## Component Relationships

Components are organized in a hierarchical structure, with layout components (like BaseLayout and MarkdownPostLayout) wrapping content components. The `<slot />` element is used extensively to inject content from Markdown files in the content collections.

## Notes

- All components follow Astro's `.astro` file format with a mix of frontmatter, HTML templates, and component script sections
- Components leverage Astro's optimized rendering for minimal client-side JavaScript
- All styling uses Tailwind CSS v4.0.8 utilities for consistency and performance

## Deprecated Components

Some files in the components directory are remnants from the development process and can be ignored.