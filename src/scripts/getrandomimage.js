document.addEventListener('astro:page-load', function() {
  let imageElements = document.querySelectorAll('.relative.group.border-0');

  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);
    let alt = JSON.parse(element.dataset.alt); // Parse the alt texts

    // Shuffle the arrays
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      let tempImage = images[i];
      let tempAlt = alt[i];
      images[i] = images[j];
      alt[i] = alt[j];
      images[j] = tempImage;
      alt[j] = tempAlt;
    }

    let imgElement = element.querySelector('img');
    imgElement.src = images[0]; // Use the first image
    imgElement.alt = alt[0]; // Use the corresponding alt text
  });
});