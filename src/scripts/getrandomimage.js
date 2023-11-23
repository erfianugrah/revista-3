document.addEventListener('astro:page-load', function() {
  let imageElements = document.querySelectorAll('.relative.group.border-0');
  
  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);
    let alt = JSON.parse(element.dataset.alt); // Parse the alt texts

    // Fisher-Yates shuffle
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
      [alt[i], alt[j]] = [alt[j], alt[i]];
    }

    element.querySelector('img').src = images[0]; // Use the first image
    element.querySelector('img').alt = alt[0]; // Use the first alt text
  });
});