// document.addEventListener('astro:after-swap', handlePageLoad);
function handlePageLoad() {
  let imageElements = Array.from(document.querySelectorAll("#homepage"));

  imageElements.forEach((element) => {
    let { images, alt, urls } = JSON.parse(element.dataset);
    let width = element.dataset.width;
    let height = element.dataset.height;

    let items = images.reduce((accumulator, image, index) => {
      accumulator.push({
        image,
        alt: alt[index],
        url: urls[index],
        width,
        height,
      });
      return accumulator;
    }, []);

    // Shuffle the items array
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    let imgElement = element.querySelector("img");
    let anchorElement = element.querySelector("a");

    Object.assign(imgElement, {
      src: items[0].image,
      alt: items[0].alt,
      width: items[0].width,
      height: items[0].height,
    });
    anchorElement.href = items[0].url;
    imgElement.classList.remove("hidden");
  });
}

document.addEventListener("astro:page-load", handlePageLoad);
