/**
 * Custom image lightbox.
 *
 * Features: smooth open/close with scale + fade, image crossfade on
 * prev/next, keyboard nav (arrows + Escape), touch swipe, loop,
 * adjacent preload, body scroll lock, proper View Transitions cleanup,
 * zoom (single-click, scroll wheel, pinch, button), drag/pan when zoomed.
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

// Zoom / pan state
let scale = 1;
let translateX = 0;
let translateY = 0;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Cached base dimensions of the image at scale=1 (avoids getBoundingClientRect in hot path)
let imgBaseW = 0;
let imgBaseH = 0;

// Drag state (mouse + touch-single-finger pan)
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTranslateX = 0;
let dragStartTranslateY = 0;
let hasDragged = false; // distinguish click from drag

// Touch swipe state (1x only)
let touchStartX = 0;
let touchDeltaX = 0;

// Pinch state
let lastPinchDist = 0;

// Track listeners for proper cleanup
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let wheelHandler: ((e: WheelEvent) => void) | null = null;

// --------------- Zoom helpers ---------------

function isZoomed(): boolean {
  return scale > MIN_SCALE + 0.01;
}

function applyTransform(): void {
  if (!imgEl) return;
  imgEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function setCursor(cursor: string): void {
  if (imgEl && imgEl.style.cursor !== cursor) {
    imgEl.style.cursor = cursor;
  }
}

/** Cache the image's rendered size at scale=1. Call after image loads or on open. */
function cacheBaseDimensions(): void {
  if (!imgEl) return;
  // naturalWidth/Height + max-width/max-height CSS constraints
  const vw = window.innerWidth * 0.92;
  const vh = window.innerHeight * 0.92;
  const nw = imgEl.naturalWidth || 1;
  const nh = imgEl.naturalHeight || 1;
  const ratio = Math.min(vw / nw, vh / nh, 1);
  imgBaseW = nw * ratio;
  imgBaseH = nh * ratio;
}

/** Clamp translate so the image doesn't drift into empty space. Pure math, no DOM reads. */
function clampTranslate(): void {
  if (scale <= 1) {
    translateX = 0;
    translateY = 0;
    return;
  }

  const overflowX = Math.max(0, (imgBaseW * scale - window.innerWidth) / 2);
  const overflowY = Math.max(0, (imgBaseH * scale - window.innerHeight) / 2);

  translateX = Math.max(-overflowX, Math.min(overflowX, translateX));
  translateY = Math.max(-overflowY, Math.min(overflowY, translateY));
}

function resetZoom(): void {
  scale = 1;
  translateX = 0;
  translateY = 0;
  if (imgEl) {
    imgEl.style.transition =
      "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    applyTransform();
    setTimeout(() => {
      if (imgEl) imgEl.style.transition = "";
    }, 300);
  }
  setCursor("zoom-in");
  toggleNavVisibility(true);
}

/**
 * Zoom toward a specific viewport point, with an animated transition.
 */
function zoomTo(clientX: number, clientY: number, newScale: number): void {
  if (!imgEl) return;

  const prevScale = scale;
  newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
  if (newScale === prevScale) return;

  // Keep the point under the cursor/finger fixed.
  // Image center is always at viewport center (since it's in a flex-center overlay).
  const cx = window.innerWidth / 2 + translateX;
  const cy = window.innerHeight / 2 + translateY;

  const factor = 1 - newScale / prevScale;
  translateX = translateX + (clientX - cx) * factor;
  translateY = translateY + (clientY - cy) * factor;

  scale = newScale;
  clampTranslate();

  imgEl.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
  applyTransform();
  setTimeout(() => {
    if (imgEl) imgEl.style.transition = "";
  }, 250);

  setCursor(isZoomed() ? "grab" : "zoom-in");
  toggleNavVisibility(!isZoomed());
}

/**
 * Zoom instantly (no transition) — for scroll wheel and pinch.
 */
function zoomInstant(clientX: number, clientY: number, newScale: number): void {
  if (!imgEl) return;

  const prevScale = scale;
  newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
  if (newScale === prevScale) return;

  const cx = window.innerWidth / 2 + translateX;
  const cy = window.innerHeight / 2 + translateY;

  const factor = 1 - newScale / prevScale;
  translateX = translateX + (clientX - cx) * factor;
  translateY = translateY + (clientY - cy) * factor;

  scale = newScale;
  clampTranslate();

  imgEl.style.transition = "";
  applyTransform();

  setCursor(isZoomed() ? "grab" : "zoom-in");
  toggleNavVisibility(!isZoomed());
}

/** Hide/show nav buttons + counter when zoomed to avoid clutter. */
function toggleNavVisibility(visible: boolean): void {
  if (!overlay) return;
  const els = overlay.querySelectorAll<HTMLElement>(
    ".lightbox-prev, .lightbox-next, .lightbox-counter",
  );
  els.forEach((el) => {
    el.style.opacity = visible ? "" : "0";
    el.style.pointerEvents = visible ? "" : "none";
  });
  const zoomBtn = overlay.querySelector<HTMLElement>(".lightbox-zoom");
  if (zoomBtn) {
    zoomBtn.innerHTML = isZoomed()
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
  }
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
  scale = 1;
  translateX = 0;
  translateY = 0;
  imgEl.style.transition = "";
  imgEl.style.transform = "";
  setCursor("zoom-in");
  toggleNavVisibility(true);

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
        cacheBaseDimensions();
      };
      el.addEventListener("load", onReady);
      setTimeout(() => {
        el.classList.remove("lightbox-img-enter");
        isAnimating = false;
        cacheBaseDimensions();
      }, 300);
    };
    el.addEventListener("transitionend", onFaded);
    setTimeout(onFaded, 200);
  } else {
    imgEl.src = img.src;
    imgEl.alt = img.alt;
    imgEl.style.transform = "";
    // Cache dimensions once loaded
    const el = imgEl;
    const onLoad = () => {
      el.removeEventListener("load", onLoad);
      cacheBaseDimensions();
    };
    if (el.complete && el.naturalWidth) {
      cacheBaseDimensions();
    } else {
      el.addEventListener("load", onLoad);
    }
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

  // After the open animation completes, remove the CSS transition on
  // transform so drag/pan is instant (no easing on every mousemove).
  setTimeout(() => {
    if (imgEl)
      imgEl.style.transition = "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  }, 400);
}

function close(): void {
  if (!overlay) return;
  scale = 1;
  translateX = 0;
  translateY = 0;
  if (imgEl) {
    imgEl.style.transform = "";
    imgEl.style.transition = "";
  }
  toggleNavVisibility(true);
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
      resetZoom();
    } else {
      zoomTo(window.innerWidth / 2, window.innerHeight / 2, 2);
    }
  });

  // Click overlay background to close (but not image, buttons, or after drag)
  el.addEventListener("click", (e) => {
    if (e.target === el && !hasDragged) close();
  });

  // ── Single click on image: toggle zoom ──
  img.addEventListener("click", (e) => {
    // Ignore if we just finished dragging
    if (hasDragged) return;
    e.stopPropagation();
    if (isZoomed()) {
      resetZoom();
    } else {
      zoomTo(e.clientX, e.clientY, 2);
    }
  });

  // ── Mouse drag for pan ──
  img.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (!isZoomed()) return;
    e.preventDefault();
    isDragging = true;
    hasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartTranslateX = translateX;
    dragStartTranslateY = translateY;
    // Kill any transition so drag is instant
    img.style.transition = "none";
    setCursor("grabbing");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
    translateX = dragStartTranslateX + dx;
    translateY = dragStartTranslateY + dy;
    clampTranslate();
    applyTransform();
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      setCursor("grab");
      // Clear hasDragged after a tick so the click handler sees it but next click doesn't
      setTimeout(() => {
        hasDragged = false;
      }, 10);
    }
  });

  // ── Touch: swipe (1x) / tap-to-zoom / pan (zoomed) / pinch ──
  el.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastPinchDist = getPinchDist(e);
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];

        if (isZoomed()) {
          // Start pan
          isDragging = true;
          hasDragged = false;
          dragStartX = touch.clientX;
          dragStartY = touch.clientY;
          dragStartTranslateX = translateX;
          dragStartTranslateY = translateY;
          // Kill any transition so drag is instant
          if (imgEl) imgEl.style.transition = "none";
        } else {
          // Start swipe detection
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
        // Pinch zoom
        e.preventDefault();
        const dist = getPinchDist(e);
        const ratio = dist / lastPinchDist;
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, scale * ratio),
        );

        const [t1, t2] = [e.touches[0], e.touches[1]];
        const cx = (t1.clientX + t2.clientX) / 2;
        const cy = (t1.clientY + t2.clientY) / 2;

        const prevScale = scale;
        const imgCx = window.innerWidth / 2 + translateX;
        const imgCy = window.innerHeight / 2 + translateY;
        const factor = 1 - newScale / prevScale;
        translateX = translateX + (cx - imgCx) * factor;
        translateY = translateY + (cy - imgCy) * factor;

        scale = newScale;
        lastPinchDist = dist;
        clampTranslate();
        if (imgEl) imgEl.style.transition = "";
        applyTransform();
        toggleNavVisibility(!isZoomed());
      } else if (e.touches.length === 1) {
        if (isDragging && isZoomed()) {
          // Pan
          e.preventDefault();
          const touch = e.touches[0];
          const dx = touch.clientX - dragStartX;
          const dy = touch.clientY - dragStartY;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
          translateX = dragStartTranslateX + dx;
          translateY = dragStartTranslateY + dy;
          clampTranslate();
          if (imgEl) imgEl.style.transition = "";
          applyTransform();
        } else if (!isZoomed()) {
          // Swipe
          touchDeltaX = e.touches[0].clientX - touchStartX;
        }
      }
    },
    { passive: false },
  );

  el.addEventListener("touchend", (e) => {
    if (isDragging) {
      isDragging = false;

      // Tap-to-zoom: if the finger didn't move, treat as a tap
      if (!hasDragged && isZoomed()) {
        resetZoom();
      }

      setTimeout(() => {
        hasDragged = false;
      }, 10);
      return;
    }

    // Snap back if pinch released below 1x
    if (scale < MIN_SCALE + 0.01 && scale !== 1) {
      resetZoom();
      return;
    }

    // Swipe navigation (only at 1x)
    if (!isZoomed() && e.touches.length === 0) {
      const threshold = 50;
      if (touchDeltaX > threshold) {
        showImage(currentIndex - 1);
      } else if (touchDeltaX < -threshold) {
        showImage(currentIndex + 1);
      }
      touchDeltaX = 0;
    }
  });

  // ── Scroll wheel zoom ──
  wheelHandler = (e: WheelEvent) => {
    if (!overlay?.classList.contains("lightbox-visible")) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    if (newScale === scale) return;

    zoomInstant(e.clientX, e.clientY, newScale);
  };
  el.addEventListener("wheel", wheelHandler, { passive: false });
}

function getPinchDist(e: TouchEvent): number {
  const [t1, t2] = [e.touches[0], e.touches[1]];
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function onKeyDown(e: KeyboardEvent): void {
  if (!overlay?.classList.contains("lightbox-visible")) return;
  switch (e.key) {
    case "Escape":
      if (isZoomed()) {
        resetZoom();
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
  scale = 1;
  translateX = 0;
  translateY = 0;
  isDragging = false;
  hasDragged = false;
  imgBaseW = 0;
  imgBaseH = 0;
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
