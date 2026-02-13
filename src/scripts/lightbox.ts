/**
 * Custom image lightbox.
 *
 * Features: smooth open/close with scale + fade, image crossfade on
 * prev/next, keyboard nav (arrows + Escape), touch swipe, loop,
 * adjacent preload, body scroll lock, proper View Transitions cleanup.
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
let isAnimating = false;

// Track listeners for proper cleanup
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

// --------------- DOM creation ---------------

function createOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "lightbox-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Image lightbox");
  el.innerHTML = `
    <button class="lightbox-close" aria-label="Close lightbox">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <button class="lightbox-prev" aria-label="Previous image">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <button class="lightbox-next" aria-label="Next image">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
    </button>
    <img class="lightbox-img" alt="" />
    <div class="lightbox-counter"></div>
  `;
  document.body.appendChild(el);
  return el;
}

// --------------- Navigation ---------------

function showImage(index: number, animate = true): void {
  if (!overlay || !imgEl || isAnimating) return;

  currentIndex = ((index % images.length) + images.length) % images.length;
  const img = images[currentIndex];

  if (animate && imgEl.src) {
    // Crossfade: fade out current, swap src, fade in new
    isAnimating = true;
    // Bind to const so closures retain the narrowed non-null type
    const el = imgEl;
    el.classList.add("lightbox-img-exit");

    const onFaded = () => {
      el.removeEventListener("transitionend", onFaded);
      el.src = img.src;
      el.alt = img.alt;
      el.classList.remove("lightbox-img-exit");
      el.classList.add("lightbox-img-enter");

      // Wait for load to avoid flash of broken-image icon
      const onReady = () => {
        el.removeEventListener("load", onReady);
        el.classList.remove("lightbox-img-enter");
        isAnimating = false;
      };
      el.addEventListener("load", onReady);
      // Safety timeout in case image is cached and load already fired
      setTimeout(() => {
        el.classList.remove("lightbox-img-enter");
        isAnimating = false;
      }, 300);
    };
    el.addEventListener("transitionend", onFaded);
    // Safety timeout for transitionend
    setTimeout(onFaded, 200);
  } else {
    imgEl.src = img.src;
    imgEl.alt = img.alt;
  }

  const counter = overlay.querySelector<HTMLDivElement>(".lightbox-counter");
  if (counter) {
    counter.textContent = `${currentIndex + 1}\u2009/\u2009${images.length}`;
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
  showImage(index, false);

  // Force reflow so the transition triggers
  void overlay.offsetHeight;
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

// --------------- Cleanup ---------------

function destroy(): void {
  // Remove keydown listener
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
    keydownHandler = null;
  }

  // Remove overlay from DOM (if it survived swap — belt & suspenders)
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  overlay = null;
  imgEl = null;
  images = [];
  currentIndex = 0;
  isAnimating = false;
}

// --------------- Init ---------------

function initialize(): void {
  // Clean up any stale state from previous navigation
  destroy();

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

  keydownHandler = onKeyDown;
  document.addEventListener("keydown", keydownHandler);
}

document.addEventListener("astro:page-load", initialize);
