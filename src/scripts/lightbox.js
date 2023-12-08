import GLightbox from 'glightbox';

document.addEventListener('astro:page-load', function () {
    const lightbox = GLightbox({
        touchNavigation: true,
        loop: true,
        width: "85vw",
        height: "85vh",
        preload: true,
        openEffect: 'face',
        closeEffect: 'fade',
        slideEffect: 'fade',
        cssEfects: {
            fade: { in: 'fadeIn', out: 'fadeOut' }
        }
    });
});