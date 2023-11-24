let shuffledImages = [];
let shuffledAlts = [];
let currentIndex = 0;

document.addEventListener('astro:page-load', function() {
  let imageElements = document.querySelectorAll('.relative.group.border-0');
  
  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);
    let alt = JSON.parse(element.dataset.alt); // Parse the alt texts

    // Shuffle the arrays if they haven't been shuffled yet
    if (shuffledImages.length === 0) {
      for (let i = images.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [images[i], images[j]] = [images[j], images[i]];
        [alt[i], alt[j]] = [alt[j], alt[i]];
      }
      shuffledImages = images;
      shuffledAlts = alt;
    }

    element.querySelector('img').src = shuffledImages[currentIndex]; // Use the next image
    element.querySelector('img').alt = shuffledAlts[currentIndex]; // Use the corresponding alt text

    // Update the current index, wrapping around to the start of the array if necessary
    currentIndex = (currentIndex + 1) % shuffledImages.length;
  });
});