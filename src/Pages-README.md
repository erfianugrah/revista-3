# Astro Pages

### Refer to [Astro docs on Pages](https://docs.astro.build/en/basics/astro-pages/)
---

## Overview

Pages in Astro define the routes of the website. This project uses static site generation (SSG) rather than server-side rendering (SSR) or hybrid rendering for optimal performance and hosting flexibility.

## Page Types

This project contains several types of pages:

### Static Pages

- **[index.astro](pages/index.astro)**: The homepage that uses [Homepage.astro](components/Homepage.astro) for layout and featured content
- **[404.astro](pages/404.astro)**: Custom error page featuring random quotes from [burgundy.js](scripts/burgundy.js)
- **[cv.astro](pages/cv.astro)**: Resume page using specialized CV components and layouts

### Collection Index Pages

- **[muses/index.astro](pages/muses/index.astro)**: Photography collections landing page
- **[short_form/index.astro](pages/short_form/index.astro)**: Short blog posts index
- **[long_form/index.astro](pages/long_form/index.astro)**: Long-form articles index
- **[zeitweilig/index.astro](pages/zeitweilig/index.astro)**: Ephemeral content index
- **[authors/index.astro](pages/authors/index.astro)**: Author profiles index

### Dynamic Pages

- **[...collection]/[...id].astro**: Individual content pages generated from collections
- **[...collection]/tags/[tag].astro**: Tag-specific pages showing all content with a given tag
- **[...collection]/tags/index.astro**: Tag listings for each collection

## Dynamic Routing

Dynamic page routes (such as individual blog posts) are generated from content collections defined in [content.config.ts](/src/content.config.ts) using Astro's `getStaticPaths()` function. For example:

```astro
---
// Example from a dynamic route page
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('short_form');
  return posts.map(post => ({
    params: { id: post.slug },
    props: { post }
  }));
}

const { post } = Astro.props;
---

<!-- Page layout and content rendering -->
```

## Component Integration

Each page incorporates [components](components/) and [layouts](layouts/) to maintain consistency and reuse code throughout the site. Pages typically:

1. Import needed components and layouts
2. Fetch data from content collections when needed
3. Define any page-specific logic in the frontmatter
4. Render the appropriate layout with relevant content

## RSS Feed Generation

Special pages in each collection directory generate RSS feeds, making content available for subscription:

- `/long_form/rss.xml`
- `/short_form/rss.xml`
- `/muses/rss.xml`
- `/zeitweilig/rss.xml`

## Type Safety

All pages benefit from full TypeScript support with Astro v5.15.9's enhanced type system and the performance optimizations in Astro's latest version. The content collections use a consistent schema that enables type-safe access to content throughout the pages.