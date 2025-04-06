// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
// 2. Define a `type` and `schema` for each collection
const muses = defineCollection({
  // type: "content", // v2.5.0 and later
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/muses" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    description: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      positionx: z.string().optional(),
      positiony: z.string().optional(),
    }).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const short_form = defineCollection({
  // type: "content", // v2.5.0 and later
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
      positiony: z.string().optional(),
    }).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const long_form = defineCollection({
  // type: "content", // v2.5.0 and later
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/long_form" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    description: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      positionx: z.string().optional(),
      positiony: z.string().optional(),
    }).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const zeitweilig = defineCollection({
  // type: "content", // v2.5.0 and later
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/zeitweilig" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    description: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      positionx: z.string().optional(),
      positiony: z.string().optional(),
    }).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const authors = defineCollection({
  // type: "content", // v2.5.0 and later
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/authors" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    description: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      positionx: z.string().optional(),
      positiony: z.string().optional(),
    }).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const cv = defineCollection({
  // type: "content", // v2.5.0 and later
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/cv" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    description: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      positionx: z.string().optional(),
      positiony: z.string().optional(),
    }).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    contacts: z.array(
      z.object({
        type: z.string(),
        value: z.string(),
        url: z.string(),
        icon: z.string(),
      })
    ).optional(),
  }),
});
// 3. Export a single `collections` object to register your collection(s)
export const collections = {
  muses,
  short_form,
  long_form,
  zeitweilig,
  authors,
  cv,
};
