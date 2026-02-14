/**
 * Content collection definitions.
 *
 * All collections share a `baseSchema` for common frontmatter fields.
 * The CV collection extends it with professional fields (companies,
 * skills, education, etc.). Collections use Astro's glob loader to
 * select MDX files; filenames starting with `_` are excluded (drafts).
 */
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/** Shared shape of a content collection entry used across all collections. */
const baseSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()),
  author: z.string(),
  description: z.string(),
  image: z
    .object({
      src: z.string(),
      alt: z.string(),
      positionx: z.string().optional(),
      positiony: z.string().optional(),
    })
    .optional(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
});

const muses = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/muses" }),
  schema: baseSchema,
});

const short_form = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/short_form" }),
  schema: baseSchema,
});

const long_form = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/long_form" }),
  schema: baseSchema,
});

const zeitweilig = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/zeitweilig" }),
  schema: baseSchema,
});

const authors = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/authors" }),
  schema: baseSchema,
});

/** CV extends baseSchema with structured professional data. */
const cv = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.mdx", base: "./src/content/cv" }),
  schema: baseSchema.extend({
    fullName: z.string().optional(),
    sections: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
        }),
      )
      .optional(),
    contacts: z
      .array(
        z.object({
          type: z.string(),
          value: z.string(),
          url: z.string(),
          icon: z.string(),
        }),
      )
      .optional(),
    skills: z
      .array(
        z.object({
          name: z.string(),
          level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
          category: z.string().optional(),
        }),
      )
      .optional(),
    languages: z
      .array(
        z.object({
          language: z.string(),
          proficiency: z.string(),
          level: z
            .enum(["beginner", "intermediate", "advanced", "expert"])
            .optional(),
        }),
      )
      .optional(),
    education: z
      .array(
        z.object({
          institution: z.string(),
          degree: z.string(),
          dateRange: z.union([
            z.string(),
            z.object({
              start: z.string(),
              end: z.string().optional(),
            }),
          ]),
        }),
      )
      .optional(),
    companies: z
      .array(
        z.object({
          name: z.string(),
          positions: z.array(
            z.object({
              title: z.string(),
              dateRange: z.union([
                z.string(),
                z.object({
                  start: z.string(),
                  end: z.string().optional(),
                }),
              ]),
              responsibilities: z.array(z.string()),
              achievements: z.array(z.string()).optional(),
            }),
          ),
        }),
      )
      .optional(),
  }),
});

export const collections = {
  muses,
  short_form,
  long_form,
  zeitweilig,
  authors,
  cv,
};
