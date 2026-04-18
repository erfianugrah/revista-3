/**
 * Shared logic for picking a random image from a data-attribute-driven
 * <img> element. Used by both Homepage and tag random images.
 *
 * Each element stores a JSON array of {src, srcset, alt, url?} in
 * data-images. Client JS shuffles and picks one to display.
 */
import { shuffle } from "./utils.ts";

interface ImageData {
  src: string;
  srcset: string;
  alt: string;
  url?: string;
}

export function initRandomImages(
  selector: string,
  options: { updateAnchor?: boolean } = {},
): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

  if (elements.length === 0) return;

  elements.forEach((element) => {
    try {
      const images: ImageData[] = JSON.parse(element.dataset.images ?? "[]");
      if (images.length === 0) return;

      const selected = shuffle(images)[0];
      if (!selected) return;

      const imgElement = element.querySelector<HTMLImageElement>("img");
      if (imgElement) {
        imgElement.src = selected.src;
        imgElement.srcset = selected.srcset;
        imgElement.alt = selected.alt;
        imgElement.classList.remove("hidden");
      }

      if (options.updateAnchor && selected.url) {
        const anchorElement = element.querySelector<HTMLAnchorElement>("a");
        if (anchorElement) {
          anchorElement.href = selected.url;
          anchorElement.setAttribute("aria-label", `View ${selected.alt}`);
        }
      }
    } catch (error) {
      console.error("Error processing random image data:", error);
    }
  });
}
