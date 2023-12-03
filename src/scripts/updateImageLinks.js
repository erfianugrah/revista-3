document.addEventListener('astro:page-load', () => {
    // Create a new script element for the fslightbox.js script
    const fslightboxScript = document.createElement('script');
    fslightboxScript.src = '../scripts/fslightbox.js';

    // Add an event listener for the load event of the fslightbox.js script
    fslightboxScript.addEventListener('load', () => {
        const imageContainers = document.querySelectorAll('.masonry .image-container');

        imageContainers.forEach(container => {
            const imageLink = container.querySelector('.image-link');
            const image = container.querySelector('.image');

            if (imageLink && image) {
                imageLink.href = image.src;
            }
        });

        if (window.refreshFsLightbox) {
            window.refreshFsLightbox();
        }
    });

    // Append the fslightbox.js script to the document
    document.body.appendChild(fslightboxScript);
});