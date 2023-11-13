// 1. Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";

// 2. Define a `type` and `schema` for each collection
const muses = defineCollection({
  type: "content", // v2.5.0 and later
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    //description: z.string(),
    // image: z.object({
    //   src: z.string(),
    //   alt: z.string(),
    // }),
    pubDate: z.date(),
    updatedDate: z.date(),
  }),
});

// 3. Export a single `collections` object to register your collection(s)
export const collections = { muses };
