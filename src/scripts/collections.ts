import rss from "@astrojs/rss";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";

const parser = new MarkdownIt();

/** Valid content collection names for use with getCollection(). */
export type CollectionName =
  | "muses"
  | "short_form"
  | "long_form"
  | "zeitweilig"
  | "authors"
  | "cv";

/** Shared shape of a content collection entry used across all collections. */
interface CollectionPost {
  id: string;
  body?: string;
  data: {
    title: string;
    description: string;
    tags: string[];
    pubDate: Date;
    updatedDate?: Date;
    author: string;
    image?: {
      src: string;
      alt: string;
      positionx?: string;
      positiony?: string;
    };
  };
}

/**
 * Build static paths for a collection's [...id] detail pages.
 * Generic so the original Astro collection entry type is preserved
 * (required by `render()`).
 */
export function buildDetailPaths<T extends CollectionPost>(entries: T[]) {
  return entries.map((entry) => ({
    params: { id: entry.id },
    props: { entry },
  }));
}

/**
 * Build static paths for a collection's tags/[tag] pages.
 */
export function buildTagPaths<T extends CollectionPost>(
  entries: T[],
  collectionSlug: string,
) {
  const uniqueTags = [...new Set(entries.map((post) => post.data.tags).flat())];
  return uniqueTags.map((tag: string) => {
    const filteredPosts = entries.filter((post) =>
      post.data.tags.includes(tag),
    );
    return {
      params: { tag },
      props: { posts: filteredPosts, collectionSlug },
    };
  });
}

/**
 * Generate an RSS feed for a collection.
 */
export function generateRss(
  entries: CollectionPost[],
  collectionSlug: string,
  context: { site?: URL },
) {
  if (!context.site) {
    throw new Error("site must be defined in astro.config for RSS generation");
  }
  return rss({
    stylesheet: "/rss/rss.xsl",
    title: "stoicopa",
    description: "My personal hamster wheel.",
    site: context.site,
    items: entries.map((post) => ({
      ...post.data,
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/${collectionSlug}/${post.id}/`,
      content: sanitizeHtml(parser.render(post.body ?? "")),
    })),
    customData: `<language>en-us</language>`,
  });
}
