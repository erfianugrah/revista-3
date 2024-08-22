function handlePageLoad() {
  const imageElements = Array.from(document.querySelectorAll('#randomimage'));

  if (imageElements.length === 0) {
    return; // Exit the function if no #randomimage elements are found
  }

  imageElements.forEach((element) => {
    try {
      const images = JSON.parse(element.dataset.images);
      const alt = JSON.parse(element.dataset.alt);
      const { width, height } = element.dataset;

      const items = images.map((image, index) => ({
        image,
        alt: alt[index],
        width,
        height,
      }));

      // Shuffle the items array (Fisher-Yates algorithm)
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      const imgElement = element.querySelector('img');

      if (imgElement) {
        const firstItem = items[0];
        imgElement.src = firstItem.image;
        imgElement.alt = firstItem.alt;
        imgElement.width = firstItem.width;
        imgElement.height = firstItem.height;
        imgElement.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error processing random image data:', error);
    }
  });
}

document.addEventListener('astro:page-load', handlePageLoad);
// document.addEventListener('astro:after-swap', handlePageLoad);
