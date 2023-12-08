import "./glightbox.js";
import "../styles/glightbox.css";

document.addEventListener('astro:page-load', function () {
    const lightbox = GLightbox({
        touchNavigation: true,
        loop: true,
        width: "85vw",
        height: "85vh",
        preload: true,
        openEffect: 'zoom',
        closeEffect: 'fade',
        cssEfects: {
            // This are some of the animations included, no need to overwrite
            fade: { in: 'fadeIn', out: 'fadeOut' },
            zoom: { in: 'zoomIn', out: 'zoomOut' }
        }
    });
});