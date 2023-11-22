  document.addEventListener('astro:page-load', function() {
    const images = JSON.parse(document.querySelector('.relative.group.border-0').dataset.images);
    const randomImage = images[Math.floor(Math.random() * images.length)];
    document.getElementById('randomImage').src = randomImage;
  });