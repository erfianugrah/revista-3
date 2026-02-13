import GLightbox from "glightbox";

function initialize(): void {
  GLightbox({
    touchNavigation: true,
    closeButton: true,
    loop: true,
    width: "85vw",
    height: "85vh",
    preload: true,
    openEffect: "fade",
    closeEffect: "fade",
    slideEffect: "fade",
    dragAutoSnap: true,
    cssEffects: {
      fade: { in: "fadeIn", out: "fadeOut" },
    },
  });
}

document.addEventListener("astro:page-load", initialize);
