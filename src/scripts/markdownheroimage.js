document.addEventListener('astro:page-load', () => {
    const imageElement = document.getElementById('backgroundImage');
    const backgroundImageElement = document.getElementById('backgroundImageElement');
    
    if (imageElement && backgroundImageElement) {
        const setBgImage = () => {
            const optimizedImageUrl = imageElement.currentSrc;
            backgroundImageElement.style.backgroundImage = `url(${optimizedImageUrl})`;
        }

        if (imageElement.complete) {
            setBgImage();
        } else {
            imageElement.onload = setBgImage;
        }
    }
});