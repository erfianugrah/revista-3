document.addEventListener('astro:page-load', function() {
  let imageElements = Array.from(document.querySelectorAll('.relative.group.border-0'));

  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);
    let alt = JSON.parse(element.dataset.alt); // Parse the alt texts

    // Combine the images and alt texts into a single array of objects
    let items = images.map((image, index) => {
      return {
        image: image,
        alt: alt[index]
      };
    });

    // Shuffle the items array
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    let imgElement = element.querySelector('img');

    // Use the first item
    let firstItem = items[0];
    imgElement.src = firstItem.image;
    imgElement.alt = firstItem.alt;
  });
});