# Astro Layouts

### Refer to [Astro docs on Layouts](https://docs.astro.build/en/basics/layouts/)
---

## Overview

This project uses Astro v5.6.0's enhanced layout capabilities with Tailwind CSS v4.0.8 for styling. Layouts provide reusable UI structures that define the visual framework for different page types throughout the site.

## Layout Architecture

Layouts in this project follow a hierarchical structure:

1. **Base Layout**: [BaseLayout.astro](layouts/BaseLayout.astro) serves as the foundation for all pages, providing the common HTML structure, metadata handling, and global components like header and footer.

2. **Content-Specific Layouts**:
   - **[MarkdownPostLayout.astro](layouts/MarkdownPostLayout.astro)**: Handles rendering of MDX content with advanced features like the Masonry image gallery
   - **[BlogPost.astro](layouts/BlogPost.astro)**: Specialized layout for blog entries with appropriate metadata and styling
   - **[TagLayout.astro](layouts/TagLayout.astro)**: Layout for tag pages with random featured images via getRandomImage component

## Content Injection

You'll see `<slot />` elements frequently throughout these layout files. This is Astro's mechanism for content injection, allowing content from [content collections](/src/content.config.ts) to be inserted into the layout. For example:

```astro
---
// Example layout frontmatter
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<html>
  <head>
    <!-- Metadata -->
  </head>
  <body>
    <Header />
    <main>
      <!-- Content from page or component using this layout gets inserted here -->
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

## Type Safety

Layouts receive strongly-typed props from content collections, ensuring that the required data is always available for rendering. The content collections are defined using Astro's glob loader pattern, which provides enhanced type safety and explicit file selection.

## Responsive Design

All layouts incorporate responsive design principles through Tailwind CSS v4 utilities. They adapt seamlessly to different screen sizes with custom breakpoints optimized for photography viewing at 800px, 1200px, 1900px, 2500px, and 3800px.

## Performance Optimization

Layouts are designed for optimal performance with:

1. Minimal client-side JavaScript
2. Efficient rendering through Astro's partial hydration
3. Properly configured metadata for SEO
4. Optimized asset loading with prefetch directives