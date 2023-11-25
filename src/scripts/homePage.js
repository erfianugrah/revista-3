document.addEventListener('astro:page-load', function() {
  let imageElements = Array.from(document.querySelectorAll('.relative.group.border-0'));

  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);
    let alt = JSON.parse(element.dataset.alt); // Parse the alt texts
    let urls = JSON.parse(element.dataset.urls); // Parse the urls

    // Your current shuffling algorithm
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      let tempImage = images[i];
      let tempAlt = alt[i];
      let tempUrl = urls[i];
      images[i] = images[j];
      alt[i] = alt[j];
      urls[i] = urls[j];
      images[j] = tempImage;
      alt[j] = tempAlt;
      urls[j] = tempUrl;
    }

    let imgElement = element.querySelector('img');
    imgElement.src = images[0]; // Use the first image
    imgElement.alt = alt[0]; // Use the corresponding alt text

    let anchorElement = element.querySelector('a');
    anchorElement.href = urls[0]; // Use the corresponding url
  });
});