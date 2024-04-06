function handlePageLoad() {
  const imageElements = Array.from(
    document.querySelectorAll("#randomimage img"),
  ); // Select only the <img> elements inside #randomimage

  if (imageElements.length === 0) {
    return; // Exit the function if no <img> elements are found
  }

  imageElements.forEach((element) => {
    const alt = JSON.parse(element.dataset.alt); // Parse the alt texts
    const { width, height } = element.dataset; // Get the width and height attributes

    // Combine the images and alt texts into a single array of objects
    const items = JSON.parse(element.dataset.images).map((image, index) => ({
      image,
      alt: alt[index],
      width,
      height,
    }));

    // Shuffle the items array
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    // Use the first item and set its properties on the <img> element
    const firstItem = items[0];
    element.src = firstItem.image;
    element.alt = firstItem.alt;
    element.width = firstItem.width;
    element.height = firstItem.height;
    element.classList.remove("hidden"); // Remove the 'hidden' class
  });
}

document.addEventListener("astro:page-load", handlePageLoad);
// document.addEventListener('astro:after-swap', handlePageLoad);
