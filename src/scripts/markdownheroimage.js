document.addEventListener('astro:page-load', () => {
    const imageElement = document.getElementById('backgroundImage');
    const backgroundImageElement = document.getElementById('backgroundImageElement');
    
    if (imageElement && backgroundImageElement) {
        const optimizedImageUrl = imageElement.currentSrc;
        backgroundImageElement.style.backgroundImage = `url(${optimizedImageUrl})`;
    }
});