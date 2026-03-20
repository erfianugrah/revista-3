import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    // readingTime.text gives a friendly string ("3 min read");
    // readingTime.time gives the precise duration in milliseconds.
    data.astro.frontmatter.minutesRead = readingTime.text;
    data.astro.frontmatter.readingTimeMs = readingTime.time;
  };
}
