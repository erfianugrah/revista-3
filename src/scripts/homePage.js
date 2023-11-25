document.addEventListener('astro:page-load', function() {
  let imageElements = Array.from(document.querySelectorAll('.relative.group.border-0'));

  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);
    let alt = JSON.parse(element.dataset.alt); // Parse the alt texts
    let urls = JSON.parse(element.dataset.urls); // Parse the urls

    // Combine the images, alt texts, and URLs into a single array of objects
    let items = images.map((image, index) => {
      return {
        image: image,
        alt: alt[index],
        url: urls[index]
      };
    });

    // Shuffle the items array
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    let imgElement = element.querySelector('img');
    let anchorElement = element.querySelector('a');

    // Use the first item
    let firstItem = items[0];
    imgElement.src = firstItem.image;
    imgElement.alt = firstItem.alt;
    anchorElement.href = firstItem.url;
  });
});