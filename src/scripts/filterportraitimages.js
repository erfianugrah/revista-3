export async function filterPortraitImages(imageUrls) {
    const portraitImages = [];
    
    for (let url of imageUrls) {
        const img = new Image();
        img.src = url;
        const isLoaded = await new Promise(resolve => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        });

        if (isLoaded && img.naturalHeight > img.naturalWidth) {
            portraitImages.push(url);
        }
    }

    return portraitImages;
}