document.addEventListener('astro:page-load', function() {
  let images = JSON.parse(document.querySelector('.relative.group.border-0').dataset.images);
  let alt = JSON.parse(document.querySelector('.relative.group.border-0').dataset.alt); // Parse the alt texts

  // Fisher-Yates shuffle
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
    [alt[i], alt[j]] = [alt[j], alt[i]];
  }

  document.getElementById('randomImage').src = images[0]; // Use the first image
  document.getElementById('randomImage').alt = alt[0]; // Use the first alt text
});