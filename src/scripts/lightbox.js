import GLightbox from 'glightbox';

document.addEventListener('astro:page-load', function () {
    const lightbox = GLightbox({
        touchNavigation: true,
        closeButton: true,
        loop: true,
        width: "85vw",
        height: "85vh",
        preload: true,
        openEffect: 'fade',
        closeEffect: 'fade',
        slideEffect: 'fade',
        dragAutoSnap: true,
        cssEfects: {
            fade: { in: 'fadeIn', out: 'fadeOut' }
        }
    });
});