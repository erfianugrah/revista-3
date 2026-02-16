/**
 * Custom image lightbox.
 *
 * Features: smooth open/close with scale + fade, image crossfade on
 * prev/next, keyboard nav (arrows + Escape), touch swipe, loop,
 * adjacent preload, body scroll lock, proper View Transitions cleanup,
 * multi-level zoom (click, scroll wheel, pinch, button), drag/pan when zoomed.
 *
 * Zoom uses a single CSS transform: scale() + translate3d(). This is a
 * pure compositor operation — no layout recalculation on zoom or drag,
 * so scroll-wheel zoom is smooth even at high frame rates.
 */

interface LightboxImage {
  src: string;
  alt: string;
}

let images: LightboxImage[] = [];
let currentIndex = 0;
let overlay: HTMLDivElement | null = null;
let imgEl: HTMLImageElement | null = null;
let isAnimating = false;

// Zoom state — 1.0 means "fit to viewport" (CSS-constrained)
let zoomLevel = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const WHEEL_STEP = 1.15; // multiplier per scroll tick — small for smooth feel

// Pan state (in screen pixels, pre-scale)
let panX = 0;
let panY = 0;

// Drag state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragPanStartX = 0;
let dragPanStartY = 0;
let hasDragged = false;

// Touch swipe state (1x only)
let touchStartX = 0;
let touchDeltaX = 0;

// Pinch state
let lastPinchDist = 0;
let pinchBaseZoom = 1;

// Track listeners for proper cleanup
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

// rAF throttle for drag/pan — prevents layout thrash on high-Hz displays
let dragRafId = 0;

/** Whether the image is zoomed beyond fit-to-viewport. */
function isZoomed(): boolean {
  return zoomLevel > MIN_ZOOM;
}

// --------------- Zoom ---------------

/**
 * Apply the current zoom + pan as a single CSS transform.
 * Pure compositor — no layout/reflow.
 */
function applyTransform(img: HTMLImageElement): void {
  img.style.transform =
    zoomLevel <= MIN_ZOOM
      ? ""
      : `scale(${zoomLevel}) translate3d(${panX}px, ${panY}px, 0)`;
}

/**
 * Zoom to a new level, optionally keeping the viewport point (cx, cy)
 * fixed under the cursor.
 */
function applyZoom(
  img: HTMLImageElement,
  newLevel: number,
  cx?: number,
  cy?: number,
): void {
  const prevLevel = zoomLevel;
  newLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newLevel));
  if (newLevel === prevLevel) return;

  if (newLevel <= MIN_ZOOM) {
    zoomOut(img);
    return;
  }

  // Anchor zoom on cursor position so the point under the cursor stays fixed.
  // The image center is the transform-origin (set by CSS).
  // Screen position of image center = viewport center (flexbox) + pan * scale.
  if (cx !== undefined && cy !== undefined) {
    const rect = img.getBoundingClientRect();
    const imgCx = rect.left + rect.width / 2;
    const imgCy = rect.top + rect.height / 2;

    // Vector from image center to cursor, in screen pixels
    const dx = cx - imgCx;
    const dy = cy - imgCy;

    // Adjust pan so the cursor point stays fixed after scale change.
    // cursor_world = pan + dx/prevLevel → must equal new pan + dx/newLevel
    panX += dx / prevLevel - dx / newLevel;
    panY += dy / prevLevel - dy / newLevel;
  }

  zoomLevel = newLevel;
  img.style.cursor = "grab";
  applyTransform(img);

  overlay?.classList.add("zoomed");
  toggleNavVisibility(false);
}

function zoomOut(img: HTMLImageElement): void {
  zoomLevel = MIN_ZOOM;
  panX = 0;
  panY = 0;
  img.style.cursor = "zoom-in";
  applyTransform(img);

  overlay?.classList.remove("zoomed");
  toggleNavVisibility(true);
}

/** Hide/show nav buttons + counter when zoomed. */
function toggleNavVisibility(visible: boolean): void {
  if (!overlay) return;
  const els = overlay.querySelectorAll<HTMLElement>(
    ".lightbox-prev, .lightbox-next, .lightbox-counter",
  );
  els.forEach((el) => {
    el.style.opacity = visible ? "" : "0";
    el.style.pointerEvents = visible ? "" : "none";
  });
  updateZoomIcon();
}

/** Update the zoom button icon to reflect current state. */
function updateZoomIcon(): void {
  const zoomBtn = overlay?.querySelector<HTMLElement>(".lightbox-zoom");
  if (!zoomBtn) return;
  zoomBtn.innerHTML = isZoomed()
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
}

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
    <button class="lightbox-zoom" aria-label="Zoom in">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
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

  // Reset zoom before switching
  if (isZoomed()) zoomOut(imgEl);
  imgEl.style.transition = "";
  imgEl.style.transform = "";

  currentIndex = ((index % images.length) + images.length) % images.length;
  const img = images[currentIndex];

  if (animate && imgEl.src) {
    isAnimating = true;
    const el = imgEl;
    el.classList.add("lightbox-img-exit");

    const onFaded = () => {
      el.removeEventListener("transitionend", onFaded);
      el.src = img.src;
      el.alt = img.alt;
      el.style.transform = "";
      el.classList.remove("lightbox-img-exit");
      el.classList.add("lightbox-img-enter");

      const onReady = () => {
        el.removeEventListener("load", onReady);
        el.classList.remove("lightbox-img-enter");
        isAnimating = false;
      };
      el.addEventListener("load", onReady);
      setTimeout(() => {
        el.classList.remove("lightbox-img-enter");
        isAnimating = false;
      }, 300);
    };
    el.addEventListener("transitionend", onFaded);
    setTimeout(onFaded, 200);
  } else {
    imgEl.src = img.src;
    imgEl.alt = img.alt;
    imgEl.style.transform = "";
  }

  const counter = overlay.querySelector<HTMLDivElement>(".lightbox-counter");
  if (counter) {
    counter.textContent = `${currentIndex + 1}\u2009/\u2009${images.length}`;
  }

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

  void overlay.offsetHeight;
  overlay.classList.add("lightbox-visible");
  document.body.style.overflow = "hidden";

  // After open animation, strip the transform transition so drag is instant
  setTimeout(() => {
    if (imgEl)
      imgEl.style.transition = "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  }, 400);
}

function close(): void {
  if (!overlay) return;
  if (imgEl && isZoomed()) zoomOut(imgEl);
  if (imgEl) {
    imgEl.style.transform = "";
    imgEl.style.transition = "";
  }
  overlay.classList.remove("lightbox-visible");
  document.body.style.overflow = "";
}

// --------------- Events ---------------

function bindOverlayEvents(el: HTMLDivElement): void {
  const img = el.querySelector<HTMLImageElement>(".lightbox-img")!;

  el.querySelector(".lightbox-close")!.addEventListener("click", close);
  el.querySelector(".lightbox-prev")!.addEventListener("click", () =>
    showImage(currentIndex - 1),
  );
  el.querySelector(".lightbox-next")!.addEventListener("click", () =>
    showImage(currentIndex + 1),
  );
  el.querySelector(".lightbox-zoom")!.addEventListener("click", () => {
    if (isZoomed()) {
      zoomOut(img);
    } else {
      applyZoom(img, 2);
    }
  });

  // Click overlay background to close (but not image, buttons, or after drag)
  el.addEventListener("click", (e) => {
    if (e.target === el && !hasDragged) close();
  });

  // ── Single click on image: cycle zoom levels ──
  img.addEventListener("click", (e) => {
    if (hasDragged) return;
    e.stopPropagation();
    if (el.classList.contains("dragging-nav")) {
      zoomOut(img);
      return;
    }
    if (!isZoomed()) {
      // First click: zoom to ~2x fit (natural-ish size)
      applyZoom(img, 2, e.clientX, e.clientY);
    } else if (zoomLevel < 3) {
      // Second click: zoom further to 3.5x
      applyZoom(img, 3.5, e.clientX, e.clientY);
    } else {
      // Third click: reset
      zoomOut(img);
    }
  });

  // ── Mouse drag for pan (zoom) ──
  img.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (!isZoomed()) {
      isDragging = false;
      return;
    }
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragPanStartX = panX;
    dragPanStartY = panY;
    isDragging = true;
    hasDragged = false;
    img.classList.add("dragging");
    img.style.cursor = "grabbing";
  });

  img.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();

    // Delta in screen pixels → convert to image-local coords (divide by scale)
    const dx = (e.clientX - dragStartX) / zoomLevel;
    const dy = (e.clientY - dragStartY) / zoomLevel;
    panX = dragPanStartX + dx;
    panY = dragPanStartY + dy;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged = true;
    }

    // Throttle to one transform update per frame — avoids jank on large images
    if (!dragRafId) {
      dragRafId = requestAnimationFrame(() => {
        dragRafId = 0;
        applyTransform(img);
      });
    }
  });

  img.addEventListener("mouseup", (e) => {
    e.preventDefault();
    isDragging = false;
    if (isZoomed()) img.style.cursor = "grab";

    setTimeout(() => {
      hasDragged = false;
      img.classList.remove("dragging");
    }, 100);
  });

  // ── Touch: swipe (1x) / pan (zoomed) / pinch ──
  el.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastPinchDist = getPinchDist(e);
        pinchBaseZoom = zoomLevel;
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];

        if (isZoomed()) {
          dragStartX = touch.clientX;
          dragStartY = touch.clientY;
          dragPanStartX = panX;
          dragPanStartY = panY;
          isDragging = true;
          hasDragged = false;
          img.classList.add("dragging");
        } else {
          touchStartX = touch.clientX;
          touchDeltaX = 0;
        }
      }
    },
    { passive: false },
  );

  el.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getPinchDist(e);
        const ratio = dist / lastPinchDist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        applyZoom(img, pinchBaseZoom * ratio, midX, midY);
      } else if (e.touches.length === 1) {
        if (isDragging && isZoomed()) {
          e.preventDefault();
          const touch = e.touches[0];
          const dx = (touch.clientX - dragStartX) / zoomLevel;
          const dy = (touch.clientY - dragStartY) / zoomLevel;
          panX = dragPanStartX + dx;
          panY = dragPanStartY + dy;
          hasDragged = true;
          if (!dragRafId) {
            dragRafId = requestAnimationFrame(() => {
              dragRafId = 0;
              applyTransform(img);
            });
          }
        } else if (!isZoomed()) {
          touchDeltaX = e.touches[0].clientX - touchStartX;
        }
      }
    },
    { passive: false },
  );

  el.addEventListener("touchend", () => {
    if (isDragging) {
      isDragging = false;
      setTimeout(() => {
        hasDragged = false;
        img.classList.remove("dragging");
      }, 100);
      return;
    }

    if (!isZoomed()) {
      const threshold = 50;
      if (touchDeltaX > threshold) {
        showImage(currentIndex - 1);
      } else if (touchDeltaX < -threshold) {
        showImage(currentIndex + 1);
      }
      touchDeltaX = 0;
    }
  });

  // ── Scroll wheel zoom — centered on cursor, rAF-throttled ──
  let wheelRafId = 0;
  let pendingWheelLevel = 0;
  let pendingWheelCx = 0;
  let pendingWheelCy = 0;

  el.addEventListener(
    "wheel",
    (e) => {
      if (!overlay?.classList.contains("lightbox-visible")) return;
      e.preventDefault();
      // Accumulate zoom direction — use latest cursor position
      pendingWheelLevel =
        e.deltaY < 0 ? zoomLevel * WHEEL_STEP : zoomLevel / WHEEL_STEP;
      pendingWheelCx = e.clientX;
      pendingWheelCy = e.clientY;

      if (!wheelRafId) {
        wheelRafId = requestAnimationFrame(() => {
          wheelRafId = 0;
          applyZoom(img, pendingWheelLevel, pendingWheelCx, pendingWheelCy);
        });
      }
    },
    { passive: false },
  );
}

function getPinchDist(e: TouchEvent): number {
  const [t1, t2] = [e.touches[0], e.touches[1]];
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function onKeyDown(e: KeyboardEvent): void {
  if (!overlay?.classList.contains("lightbox-visible")) return;
  switch (e.key) {
    case "Escape":
      if (isZoomed() && imgEl) {
        zoomOut(imgEl);
      } else {
        close();
      }
      break;
    case "ArrowLeft":
      if (!isZoomed()) showImage(currentIndex - 1);
      break;
    case "ArrowRight":
      if (!isZoomed()) showImage(currentIndex + 1);
      break;
  }
}

// --------------- Cleanup ---------------

function destroy(): void {
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
    keydownHandler = null;
  }

  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  overlay = null;
  imgEl = null;
  images = [];
  currentIndex = 0;
  isAnimating = false;
  zoomLevel = MIN_ZOOM;
  isDragging = false;
  hasDragged = false;
  panX = 0;
  panY = 0;
  if (dragRafId) {
    cancelAnimationFrame(dragRafId);
    dragRafId = 0;
  }
}

// --------------- Init ---------------

function initialize(): void {
  destroy();

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
