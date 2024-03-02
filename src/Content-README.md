# Astro Content Collections

### Refer to [Astro docs on Content Collections](https://docs.astro.build/en/guides/content-collections/)
---

The folders in this directory are where the posts/images, essentially the content, hence the name "Content Collections". In [config.ts](content/config.ts) is where we set the schema as to what props can be passed to [Astro props](https://docs.astro.build/en/guides/content-collections/#passing-content-as-props) which then can be used in the layouts or components to render the content.

The schema in [config.ts](content/config.ts) will referencing objects in the frontmatter of the post:
```
---
title: Sisyphean
slug: sisyphean
pubDate: 2020-12-23T08:10:57.000Z
updatedDate: 2022-03-17T10:37:55.000Z
tags: [ 'muses' ]
author: "Erfi Anugrah"
image: { src: https://cdn.erfianugrah.com/sisyphean_1.png, alt: sisyphean_1, positionx: 20%, positiony: 50% }
description: It started with an idea or rather an intention to create something but certain things never come to light. Or rather in our attempt to keep it in the shadows, it would still be inadvertently found. I guess if and when this does go out, that would probably be an ironic statement to start off with.
---
```

The objects are passed to:

```
const short_form = defineCollection({
  type: "content", // v2.5.0 and later
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

You will then see these props a lot throughout the components/layouts.