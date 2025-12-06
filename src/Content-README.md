# Astro Content Collections

### Refer to [Astro docs on Content Collections](https://docs.astro.build/en/guides/content-collections/)
---

## Overview

Content Collections are a powerful feature in Astro for organizing and managing structured content. In this project, all content (blog posts, photos, essays) is organized into collections defined in [content.config.ts](/src/content.config.ts).

## Collection Structure

The `src/content/` directory contains multiple collections, each focused on a specific content type:

- **muses/**: Photography-focused content
- **short_form/**: Brief blog posts and updates
- **long_form/**: In-depth articles and essays
- **zeitweilig/**: Temporary or ephemeral content
- **authors/**: Author information and profiles
- **cv/**: Resume and professional information

## Schema Definition

Each collection is defined in [content.config.ts](/src/content.config.ts) with a strict schema using Zod for validation. This ensures that all content follows a consistent structure and has the required metadata.

### Example Schema

```typescript
const short_form = defineCollection({
  // Modern Astro v5.16.4 collection pattern
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/short_form" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    description: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      positionx: z.string().optional(),
      positiony: z.string().optional()
    }).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});
```

## Content Frontmatter

Each content file (using .mdx format) includes frontmatter that must match the defined schema. Here's an example:

```yaml
---
title: Sisyphean
id: sisyphean
pubDate: 2020-12-23T08:10:57.000Z
updatedDate: 2022-03-17T10:37:55.000Z
tags: [ 'muses' ]
author: "Erfi Anugrah"
image: { 
  src: https://cdn.erfianugrah.com/sisyphean_1.png, 
  alt: sisyphean_1, 
  positionx: 20%, 
  positiony: 50% 
}
description: It started with an idea or rather an intention to create something but certain things never come to light. Or rather in our attempt to keep it in the shadows, it would still be inadvertently found. I guess if and when this does go out, that would probably be an ironic statement to start off with.
---

<!-- Content goes here -->
```

## Astro v5.16.4 Enhancements

The content collections in this project use Astro's modern glob loader pattern. The key benefits include:

1. **Explicit File Selection**: The `loader: glob({})` pattern provides more control over which files are included in each collection
2. **Type Safety**: Zod schemas ensure content follows the correct structure
3. **Performance**: Improved content loading and processing performance
4. **Query API**: Enhanced API for querying and filtering content

## Content Usage

Content collections are used throughout the site's components and layouts. The validated frontmatter properties become available as props that can be accessed and rendered. For example:

```astro
---
// Example from a page component
import { getCollection } from 'astro:content';
const posts = await getCollection('short_form');
---

{posts.map(post => (
  <article>
    <h2>{post.data.title}</h2>
    <p>{post.data.description}</p>
    {post.data.image && <img src={post.data.image.src} alt={post.data.image.alt} />}
  </article>
))}
```

This structured approach enables consistent presentation, easier content management, and reliable type safety across the entire project.
