document.addEventListener('astro:page-load', () => {
    const imageContainers = document.querySelectorAll('.masonry .image-container');

    imageContainers.forEach(container => {
        const imageLink = container.querySelector('.image-link');
        const image = container.querySelector('.image');

        if (imageLink && image) {
            imageLink.href = image.src;
        }
    });
});