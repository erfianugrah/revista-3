document.addEventListener('astro:page-load', () => {
    const imageElement = document.getElementById('backgroundImage');
    const backgroundImageElement = document.getElementById('backgroundImageElement');
    
    if (imageElement && backgroundImageElement) {
        const optimizedImageUrl = imageElement.currentSrc;
        const setBgImage = () => {
            backgroundImageElement.style.backgroundImage = `url(${optimizedImageUrl})`;
        }

        if (imageElement.complete) {
            setBgImage();
        }
        
        imageElement.onload = setBgImage;
    }
});