document.addEventListener('astro:page-load', () => {
    const imageElement = document.getElementById('backgroundImage');
    const optimizedImageUrl = imageElement.currentSrc;
    const backgroundImageElement = document.getElementById('backgroundImageElement');
    backgroundImageElement.style.backgroundImage = `url(${optimizedImageUrl})`;
});