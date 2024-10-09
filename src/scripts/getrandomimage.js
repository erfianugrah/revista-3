function handlePageLoad() {
  const imageElements = Array.from(document.querySelectorAll("#randomimage"));

  if (imageElements.length === 0) {
    return; // Exit the function if no #randomimage elements are found
  }

  imageElements.forEach((element) => {
    try {
      const images = JSON.parse(element.dataset.images);
      const alt = JSON.parse(element.dataset.alt);
      const width = JSON.parse(element.dataset.width);
      const height = JSON.parse(element.dataset.height);

      const items = images.large.map((image, index) => ({
        image: {
          large: images.large[index],
          medium: images.medium[index],
          small: images.small[index],
        },
        alt: alt[index],
        width,
        height,
      }));

      // Shuffle the items array (Fisher-Yates algorithm)
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      const imgElement = element.querySelector("img");
      const sourceLarge = element.querySelector("source[data-srcset-large]");
      const sourceMedium = element.querySelector("source[data-srcset-medium]");

      if (imgElement && sourceLarge && sourceMedium) {
        const firstItem = items[0];

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
// document.addEventListener('astro:after-swap', handlePageLoad);
