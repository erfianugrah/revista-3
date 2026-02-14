import { shuffle } from "./utils.ts";

function handlePageLoad(): void {
  const imageElements = Array.from(
    document.querySelectorAll<HTMLElement>("#homepage"),
  );

  imageElements.forEach((element) => {
    try {
      const images = JSON.parse(element.dataset.images ?? "{}");
      const alt = JSON.parse(element.dataset.alt ?? "[]");
      const urls = JSON.parse(element.dataset.urls ?? "[]");
      const width = JSON.parse(element.dataset.width ?? "{}");
      const height = JSON.parse(element.dataset.height ?? "{}");

      const items = images.large.map((_: string, index: number) => ({
        image: {
          large: images.large[index],
          medium: images.medium[index],
          small: images.small[index],
        },
        alt: alt[index],
        url: urls[index],
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
      const anchorElement = element.querySelector<HTMLAnchorElement>("a");

      if (imgElement && sourceLarge && sourceMedium && anchorElement) {
        const firstItem = shuffledItems[0];

        sourceLarge.srcset = firstItem.image.large;
        sourceMedium.srcset = firstItem.image.medium;
        imgElement.src = firstItem.image.small;
        imgElement.srcset = firstItem.image.small;

        imgElement.alt = firstItem.alt;
        imgElement.width = firstItem.width.small;
        imgElement.height = firstItem.height.small;
        anchorElement.href = firstItem.url;
        imgElement.classList.remove("hidden");

        anchorElement.setAttribute("aria-label", `View ${firstItem.alt}`);
      }
    } catch (error) {
      console.error("Error processing homepage data:", error);
    }
  });
}

document.addEventListener("astro:page-load", handlePageLoad);
