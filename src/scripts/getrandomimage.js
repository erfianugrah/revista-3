import { shuffle } from "./utils.ts";

function handlePageLoad() {
  const imageElements = Array.from(document.querySelectorAll("#randomimage"));

  if (imageElements.length === 0) {
    return; // Exit the function if no #randomimage elements are found
  }

  imageElements.forEach((element) => {
    try {
      const imageData = JSON.parse(element.dataset.images);
      const width = JSON.parse(element.dataset.width);
      const height = JSON.parse(element.dataset.height);

      const items = imageData.large.map((_, index) => ({
        image: {
          large: imageData.large[index],
          medium: imageData.medium[index],
          small: imageData.small[index],
        },
        alt: imageData.alt[index],
        width,
        height,
      }));

      const shuffledItems = shuffle(items);

      const imgElement = element.querySelector("img");
      const sourceLarge = element.querySelector("source[data-srcset-large]");
      const sourceMedium = element.querySelector("source[data-srcset-medium]");

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
