import { shuffle } from "./utils.ts";

function handlePageLoad(): void {
  const imageElements = Array.from(
    document.querySelectorAll<HTMLElement>("#randomimage"),
  );

  if (imageElements.length === 0) return;

  imageElements.forEach((element) => {
    try {
      const imageData = JSON.parse(element.dataset.images ?? "{}");
      const width = JSON.parse(element.dataset.width ?? "{}");
      const height = JSON.parse(element.dataset.height ?? "{}");

      const items = imageData.large.map((_: string, index: number) => ({
        image: {
          large: imageData.large[index],
          medium: imageData.medium[index],
          small: imageData.small[index],
        },
        alt: imageData.alt[index],
        width,
        height,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shuffledItems = shuffle(items) as any[];

      const imgElement = element.querySelector<HTMLImageElement>("img");
      const sourceLarge = element.querySelector<HTMLSourceElement>(
        "source[data-srcset-large]",
      );
      const sourceMedium = element.querySelector<HTMLSourceElement>(
        "source[data-srcset-medium]",
      );

      if (imgElement && sourceLarge && sourceMedium) {
        const firstItem = shuffledItems[0];

        sourceLarge.srcset = firstItem.image.large;
        sourceMedium.srcset = firstItem.image.medium;
        imgElement.src = firstItem.image.small;
        imgElement.srcset = firstItem.image.small;

        imgElement.alt = firstItem.alt;
        imgElement.width = firstItem.width.small;
        imgElement.height = firstItem.height.small;
        imgElement.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error processing random image data:", error);
    }
  });
}

document.addEventListener("astro:page-load", handlePageLoad);
