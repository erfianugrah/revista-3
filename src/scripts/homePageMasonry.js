document.addEventListener('astro:page-load', function () {
  let imageElements = Array.from(document.querySelectorAll('#homepage'));

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

    let masonryElement = document.querySelector('#masonry');

    // Create and append image elements to the masonry div
    items.forEach(item => {
      let imageDiv = document.createElement('div');
      imageDiv.style.cssText = 'break-inside: avoid; margin-bottom: 1em; padding-bottom: 1em;'; // Added paddingBottom

      let anchor = document.createElement('a');
      anchor.href = item.url;
      anchor.style = { display: 'inline-block', margin: 0, padding: 0 };

      let img = document.createElement('img');
      img.src = item.image;
      img.alt = item.alt;
      img.loading = "lazy";
      img.style = { display: 'block', margin: 0, padding: 0 };

      anchor.appendChild(img);
      imageDiv.appendChild(anchor);
      masonryElement.appendChild(imageDiv);
    });
  });
});