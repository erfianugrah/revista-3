import { getCollection } from "astro:content";
import { generateRss } from "../../scripts/collections";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const entries = await getCollection("zeitweilig");
  return generateRss(entries, "zeitweilig", context);
}
