# Astro Pages

### Refer to [Astro docs on Pages](https://docs.astro.build/en/basics/astro-pages/)

---

## Overview

Pages define the routes of the site. The project uses static site generation (SSG) for optimal performance and hosting flexibility.

## Page Types

### Static Pages

- **[index.astro](index.astro)**: Homepage using [Homepage.astro](../components/Homepage.astro) for layout and featured content
- **[404.astro](404.astro)**: Custom error page featuring random quotes from [burgundy.ts](../scripts/burgundy.ts)
- **[cv.astro](cv.astro)**: Resume page importing a pre-rendered HTML export from [cv-v0](https://github.com/erfianugrah/cv-v0)

### Collection Index Pages

Each collection has a top-level index page that lists all its entries:

- **[muses.astro](muses.astro)**: Photography collections landing page
- **[short_form.astro](short_form.astro)**: Short blog posts index
- **[long_form.astro](long_form.astro)**: Long-form articles index
- **[zeitweilig.astro](zeitweilig.astro)**: Ephemeral content index
- **[authors.astro](authors.astro)**: Author profiles index

### Dynamic Pages

Each collection follows the same routing pattern:

- **`[collection]/[...id].astro`**: Individual content pages generated from collections
- **`[collection]/tags/[tag].astro`**: Tag-specific pages showing all content with a given tag
- **`[collection]/tags/index.astro`**: Tag listings for each collection

This applies to all five collections: `muses`, `short_form`, `long_form`, `zeitweilig`, and `authors`.

## Dynamic Routing

Dynamic routes are generated from content collections defined in [content.config.ts](../content.config.ts) using `getStaticPaths()`:

```astro
---
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("short_form");
  return posts.map((post) => ({
    params: { id: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
---
```

Most of this boilerplate is handled by the shared helpers in [collections.ts](../scripts/collections.ts) - `buildDetailPaths()` and `buildTagPaths()`.

## RSS Feed Generation

Each collection directory generates an RSS feed via [collections.ts](../scripts/collections.ts)'s `generateRss()` helper:

- `/long_form/rss.xml`
- `/short_form/rss.xml`
- `/muses/rss.xml`
- `/zeitweilig/rss.xml`
- `/authors/rss.xml`

The RSS link icon in the header is conditionally shown by [rss.ts](../scripts/rss.ts) based on the current path.

## Component Integration

Each page incorporates [components](../components/) and [layouts](../layouts/) to maintain consistency. Pages typically:

1. Import needed components and layouts
2. Fetch data from content collections
3. Define any page-specific logic in the frontmatter
4. Render the appropriate layout with relevant content
