  document.addEventListener('astro:page-load', function() {
    const images = JSON.parse(document.querySelector('.relative.group.border-0').dataset.images);
    const alt = JSON.parse(document.querySelector('.relative.group.border-0').dataset.alt); // Parse the alt texts
    const index = Math.floor(Math.random() * images.length); // Get a random index
    document.getElementById('randomImage').src = images[index]; // Use the random index to get an image
    document.getElementById('randomImage').alt = altTexts[index]; // Use the same index to get an alt text
  });