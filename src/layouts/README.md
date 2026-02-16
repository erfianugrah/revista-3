# Astro Layouts

### Refer to [Astro docs on Layouts](https://docs.astro.build/en/basics/layouts/)

---

## Overview

Layouts provide the reusable page-level structures that wrap content throughout the site. They define HTML boilerplate, metadata, and shared components (header, footer), then use `<slot />` to inject page-specific content.

## Layout Hierarchy

1. **[BaseLayout.astro](BaseLayout.astro)**: Foundation for all pages - handles the common HTML structure, metadata, global scripts (theme, RSS, scroll-to-top), and shared components like Header and Footer.

2. **[MarkdownPostLayout.astro](MarkdownPostLayout.astro)**: Wraps MDX content pages. Handles the hero image (via `HeroImage` React island), formatted dates, Masonry galleries, and the `NextPost` related-content component.

3. **[AuthorLayout.astro](AuthorLayout.astro)**: Layout for author profile pages. Similar structure to MarkdownPostLayout but tailored for contributor bios.

4. **[TagLayout.astro](TagLayout.astro)**: Layout for tag listing pages. Features a random hero image (via `getRandomImage`) and renders tagged content.

## Content Injection

`<slot />` is Astro's mechanism for content injection, allowing content from the content collections to be inserted into the layout:

```astro
---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
---

<html>
  <head>
    <!-- Metadata -->
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

## Type Safety

Layouts receive strongly-typed props from content collections, validated by the Zod schemas in `content.config.ts`. The glob loader pattern provides explicit file selection and enhanced type safety.

`MarkdownPostLayout` and `TagLayout` accept a `collection` prop typed as `CollectionName` (imported from `collections.ts`) — a union of all content collection keys. This ensures `getCollection()` calls use a valid literal type rather than a plain `string`, which Astro's generated types require.

## Responsive Design

All layouts use Tailwind CSS v4 utilities with custom breakpoints optimized for photography viewing at 800px, 1200px, 1900px, 2500px, and 3800px.
