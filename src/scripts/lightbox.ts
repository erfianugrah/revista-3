/**
 * Minimal image-only lightbox.
 * Replaces GLightbox (~56KB) with ~4KB purpose-built for this site.
 *
 * Features: fade open/close, prev/next/close buttons, keyboard nav,
 * touch swipe, loop, adjacent preload, body scroll lock.
 */

interface LightboxImage {
  src: string;
  alt: string;
}

let images: LightboxImage[] = [];
let currentIndex = 0;
let overlay: HTMLDivElement | null = null;
let imgEl: HTMLImageElement | null = null;
let touchStartX = 0;
let touchDeltaX = 0;

// --------------- DOM creation ---------------

function createOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "lightbox-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Image lightbox");
  el.innerHTML = `
    <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
    <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>
    <button class="lightbox-next" aria-label="Next image">&#8250;</button>
    <img class="lightbox-img" alt="" />
    <div class="lightbox-counter"></div>
  `;
  document.body.appendChild(el);
  return el;
}

// --------------- Navigation ---------------

function showImage(index: number): void {
  if (!overlay || !imgEl) return;
  currentIndex = ((index % images.length) + images.length) % images.length;
  const img = images[currentIndex];
  imgEl.src = img.src;
  imgEl.alt = img.alt;

  const counter = overlay.querySelector<HTMLDivElement>(".lightbox-counter");
  if (counter) {
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  // Preload neighbours
  preload((currentIndex + 1) % images.length);
  preload((currentIndex - 1 + images.length) % images.length);
}

function preload(index: number): void {
  const img = new Image();
  img.src = images[index].src;
}

// --------------- Open / Close ---------------

function open(index: number): void {
  if (!overlay) {
    overlay = createOverlay();
    imgEl = overlay.querySelector<HTMLImageElement>(".lightbox-img");
    bindOverlayEvents(overlay);
  }
  showImage(index);
  overlay.classList.add("lightbox-visible");
  document.body.style.overflow = "hidden";
}

function close(): void {
  if (!overlay) return;
  overlay.classList.remove("lightbox-visible");
  document.body.style.overflow = "";
}

// --------------- Events ---------------

function bindOverlayEvents(el: HTMLDivElement): void {
  el.querySelector(".lightbox-close")!.addEventListener("click", close);
  el.querySelector(".lightbox-prev")!.addEventListener("click", () =>
    showImage(currentIndex - 1),
  );
  el.querySelector(".lightbox-next")!.addEventListener("click", () =>
    showImage(currentIndex + 1),
  );

  // Click overlay background to close (but not image or buttons)
  el.addEventListener("click", (e) => {
    if (e.target === el) close();
  });

  // Touch swipe
  el.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchDeltaX = 0;
    },
    { passive: true },
  );

  el.addEventListener(
    "touchmove",
    (e) => {
      touchDeltaX = e.changedTouches[0].clientX - touchStartX;
    },
    { passive: true },
  );

  el.addEventListener("touchend", () => {
    const threshold = 50;
    if (touchDeltaX > threshold) {
      showImage(currentIndex - 1);
    } else if (touchDeltaX < -threshold) {
      showImage(currentIndex + 1);
    }
  });
}

function onKeyDown(e: KeyboardEvent): void {
  if (!overlay?.classList.contains("lightbox-visible")) return;
  switch (e.key) {
    case "Escape":
      close();
      break;
    case "ArrowLeft":
      showImage(currentIndex - 1);
      break;
    case "ArrowRight":
      showImage(currentIndex + 1);
      break;
  }
}

// --------------- Init ---------------

function initialize(): void {
  // Collect all gallery links
  const links = document.querySelectorAll<HTMLAnchorElement>("a.glightbox");
  images = Array.from(links).map((link) => ({
    src: link.href,
    alt: link.querySelector("img")?.alt ?? "",
  }));

  if (images.length === 0) return;

  links.forEach((link, i) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      open(i);
    });
  });

  document.addEventListener("keydown", onKeyDown);
}

document.addEventListener("astro:page-load", initialize);
