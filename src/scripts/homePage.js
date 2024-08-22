function handlePageLoad() {
  const imageElements = Array.from(document.querySelectorAll('#homepage'));

  imageElements.forEach((element) => {
    try {
      const images = JSON.parse(element.dataset.images);
      const alt = JSON.parse(element.dataset.alt);
      const urls = JSON.parse(element.dataset.urls);
      const width = element.dataset.width;
      const height = element.dataset.height;

      const items = images.map((image, index) => ({
        image,
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

      const imgElement = element.querySelector('img');
      const anchorElement = element.querySelector('a');

      if (imgElement && anchorElement) {
        const firstItem = items[0];
        imgElement.src = firstItem.image;
        imgElement.alt = firstItem.alt;
        imgElement.width = firstItem.width;
        imgElement.height = firstItem.height;
        anchorElement.href = firstItem.url;
        imgElement.classList.remove('hidden');

        // Add ARIA label for better accessibility
        anchorElement.setAttribute('aria-label', `View ${firstItem.alt}`);
      }
    } catch (error) {
      console.error('Error processing homepage data:', error);
    }
  });
}

document.addEventListener('astro:page-load', handlePageLoad);
