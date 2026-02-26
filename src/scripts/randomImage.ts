/**
 * Shared logic for picking a random image from a data-attribute-driven
 * <picture> element. Used by both Homepage and tag random images.
 */
import { shuffle } from "./utils.ts";

interface RandomImageItem {
  image: { large: string; medium: string; small: string };
  alt: string;
  width: Record<string, number>;
  height: Record<string, number>;
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
      const imageData = JSON.parse(element.dataset.images ?? "{}");
      const width = JSON.parse(element.dataset.width ?? "{}");
      const height = JSON.parse(element.dataset.height ?? "{}");

      // Homepage passes alt and urls as separate data attributes
      const altData = element.dataset.alt
        ? JSON.parse(element.dataset.alt)
        : imageData.alt;
      const urlData = element.dataset.urls
        ? JSON.parse(element.dataset.urls)
        : null;

      const items: RandomImageItem[] = imageData.large.map(
        (_: string, index: number) => ({
          image: {
            large: imageData.large[index],
            medium: imageData.medium[index],
            small: imageData.small[index],
          },
          alt: Array.isArray(altData) ? altData[index] : altData,
          url: urlData ? urlData[index] : undefined,
          width,
          height,
        }),
      );

      const shuffledItems = shuffle(items);
      const firstItem = shuffledItems[0];
      if (!firstItem) return;

      const imgElement = element.querySelector<HTMLImageElement>("img");
      const sourceLarge = element.querySelector<HTMLSourceElement>(
        "source[data-srcset-large]",
      );
      const sourceMedium = element.querySelector<HTMLSourceElement>(
        "source[data-srcset-medium]",
      );

      if (imgElement && sourceLarge && sourceMedium) {
        sourceLarge.srcset = firstItem.image.large;
        sourceMedium.srcset = firstItem.image.medium;
        imgElement.src = firstItem.image.small;
        imgElement.srcset = firstItem.image.small;
        imgElement.alt = firstItem.alt;
        imgElement.width = firstItem.width.small;
        imgElement.height = firstItem.height.small;
        imgElement.classList.remove("hidden");
      }

      if (options.updateAnchor && firstItem.url) {
        const anchorElement = element.querySelector<HTMLAnchorElement>("a");
        if (anchorElement) {
          anchorElement.href = firstItem.url;
          anchorElement.setAttribute("aria-label", `View ${firstItem.alt}`);
        }
      }
    } catch (error) {
      console.error("Error processing random image data:", error);
    }
  });
}
