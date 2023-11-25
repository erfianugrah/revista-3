document.addEventListener('astro:page-load', function() {
  let imageElements = document.querySelectorAll('.relative.group.border-0');

  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);
    let alt = JSON.parse(element.dataset.alt); // Parse the alt texts
    let urls = JSON.parse(element.dataset.urls); // Parse the urls

    // Create an array of objects
    let combined = images.map((image, i) => ({image: image, alt: alt[i], url: urls[i]}));

    // Shuffle the array
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    let imgElement = element.querySelector('img');
    imgElement.src = combined[0].image; // Use the first image
    imgElement.alt = combined[0].alt; // Use the corresponding alt text

    let anchorElement = element.querySelector('a');
    anchorElement.href = combined[0].url; // Use the corresponding url
  });
});