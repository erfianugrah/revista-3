function handlePageLoad() {
  const imageElements = Array.from(document.querySelectorAll("#homepage"));

  imageElements.forEach((element) => {
    try {
      const images = JSON.parse(element.dataset.images);
      const alt = JSON.parse(element.dataset.alt);
      const urls = JSON.parse(element.dataset.urls);
      const width = JSON.parse(element.dataset.width);
      const height = JSON.parse(element.dataset.height);

      const items = images.large.map((image, index) => ({
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

      // Shuffle the items array (Fisher-Yates algorithm)
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      const imgElement = element.querySelector("img");
      const sourceLarge = element.querySelector("source[data-srcset-large]");
      const sourceMedium = element.querySelector("source[data-srcset-medium]");
      const anchorElement = element.querySelector("a");

      if (imgElement && sourceLarge && sourceMedium && anchorElement) {
        const firstItem = items[0];

        sourceLarge.srcset = firstItem.image.large;
        sourceMedium.srcset = firstItem.image.medium;
        imgElement.src = firstItem.image.small;
        imgElement.srcset = firstItem.image.small;

        imgElement.alt = firstItem.alt;
        imgElement.width = firstItem.width.small;
        imgElement.height = firstItem.height.small;
        anchorElement.href = firstItem.url;
        imgElement.classList.remove("hidden");

        // Add ARIA label for better accessibility
        anchorElement.setAttribute("aria-label", `View ${firstItem.alt}`);
      }
    } catch (error) {
      console.error("Error processing homepage data:", error);
    }
  });
}

document.addEventListener("astro:page-load", handlePageLoad);
