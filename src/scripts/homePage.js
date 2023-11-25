document.addEventListener('astro:page-load', function() {
  const imageElements = document.querySelectorAll('.relative.group.border-0');

  imageElements.forEach((element) => {
    const images = JSON.parse(element.dataset.images);
    const alt = JSON.parse(element.dataset.alt); // Parse the alt texts
    const urls = JSON.parse(element.dataset.urls); // Parse the urls

    // Shuffle the arrays
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
      [alt[i], alt[j]] = [alt[j], alt[i]];
      [urls[i], urls[j]] = [urls[j], urls[i]];
    }

    const imgElement = element.querySelector('img');
    imgElement.src = images[0]; // Use the first image
    imgElement.alt = alt[0]; // Use the corresponding alt text

    const anchorElement = element.querySelector('a');
    anchorElement.href = urls[0]; // Use the corresponding url
  });
});