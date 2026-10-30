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
 *
 * Images on image.erfi.io open as a viewport-sized resize via Cloudflare
 * Image Resizing (/cdn-cgi/image/); the original replaces it once zoom
 * passes HIRES_ZOOM, and on any resize error.
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
// Wheel zoom is exponential in the scroll distance: a 100px mouse notch
// zooms 1.15x. Trackpad pinch arrives as ctrlKey wheel events carrying
// -100 * ln(scale) per event, so 0.01/px reproduces the gesture's own scale.
const WHEEL_ZOOM_PER_PX = Math.log(1.15) / 100;
const PINCH_ZOOM_PER_PX = 0.01;
const HIRES_ZOOM = 1.5;
const RESIZE_HOST = "image.erfi.io";
const RESIZE_WIDTHS = [1280, 1920, 2560, 3840];

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

// Pinch state: zoom and the image point under the fingers' midpoint at
// touchstart, so a pinch zooms and pans together
let pinchStartDist = 0;
let pinchStartZoom = 1;
let pinchPointX = 0; // image-local, pre-scale pixels
let pinchPointY = 0;
let pinchRafId = 0;
let pinchPending: [number, number, number] | null = null;

// Track listeners for proper cleanup
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let linkController: AbortController | null = null;
// Document-level listeners added with the overlay (drag tracking)
let overlayController: AbortController | null = null;
// Element focused before opening; focus returns here on close
let returnFocusTo: HTMLElement | null = null;
// Original URL currently being decoded for the zoom upgrade
let upgrading = "";

// rAF throttle for drag/pan — prevents layout thrash on high-Hz displays
let dragRafId = 0;

/** Whether the image is zoomed beyond fit-to-viewport. */
function isZoomed(): boolean {
  return zoomLevel > MIN_ZOOM;
}

// --------------- Zoom ---------------

// While a gesture runs, zoom is a scale() transform: cheap, but it samples
// the fit-size raster, so it looks soft. SETTLE_MS after the last update the
// zoom is committed to layout (width/height = fit size * zoom, transform =
// translate only) and the browser re-rasterises the image at full detail.
// Measured in Chromium: PSNR vs a Lanczos render of the original 37.18 dB with
// scale(), 50.39 dB committed (docs/research/2026-10-30-lightbox-comparison.md).
const SETTLE_MS = 150;
let committed = false;
let baseW = 0; // fit-to-viewport layout size, measured while uncommitted
let baseH = 0;
let settleTimer = 0;

function uncommit(img: HTMLImageElement): void {
  if (!committed) return;
  committed = false;
  img.style.width = "";
  img.style.height = "";
  img.style.maxWidth = "";
  img.style.maxHeight = "";
}

/**
 * Apply the current zoom + pan as a scale() transform and schedule the
 * commit to layout size once input goes idle.
 */
function applyTransform(img: HTMLImageElement): void {
  window.clearTimeout(settleTimer);
  uncommit(img);
  if (zoomLevel <= MIN_ZOOM) {
    img.style.transform = "";
    return;
  }
  baseW = img.offsetWidth;
  baseH = img.offsetHeight;
  clampPan();
  img.style.transform = `scale(${zoomLevel}) translate3d(${panX}px, ${panY}px, 0)`;
  settleTimer = window.setTimeout(() => settle(img), SETTLE_MS);
}

function settle(img: HTMLImageElement): void {
  if (zoomLevel <= MIN_ZOOM) return;
  committed = true;
  img.style.maxWidth = "none";
  img.style.maxHeight = "none";
  img.style.width = `${baseW * zoomLevel}px`;
  img.style.height = `${baseH * zoomLevel}px`;
  // Whole device pixels: a fractional translate resamples the whole raster
  // (measured: 46.35 dB unrounded, 50.39 dB rounded)
  const dpr = window.devicePixelRatio || 1;
  const tx = Math.round(panX * zoomLevel * dpr) / dpr;
  const ty = Math.round(panY * zoomLevel * dpr) / dpr;
  img.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
}

/**
 * Keep the image covering the viewport centre: its edge may reach the
 * centre but not pass it, so a drag can never lose the image off-screen.
 */
function clampPan(): void {
  const maxX = baseW / 2;
  const maxY = baseH / 2;
  panX = Math.max(-maxX, Math.min(maxX, panX));
  panY = Math.max(-maxY, Math.min(maxY, panY));
}

/**
 * Viewport position of the image's layout centre, before translation. The
 * image is flex-centred in the fixed overlay, so this is the same whether
 * the zoom is committed or not, and offset* ignores transforms.
 */
function layoutCentre(img: HTMLImageElement): [number, number] {
  return [
    img.offsetLeft + img.offsetWidth / 2,
    img.offsetTop + img.offsetHeight / 2,
  ];
}

/** Set zoom level and pan together (pan in pre-scale pixels). */
function setZoom(
  img: HTMLImageElement,
  level: number,
  newPanX: number,
  newPanY: number,
): void {
  level = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
  if (level <= MIN_ZOOM) {
    zoomOut(img);
    return;
  }
  zoomLevel = level;
  panX = newPanX;
  panY = newPanY;
  img.style.cursor = "grab";
  // Drop the open animation's transform transition so the commit swap
  // (scale -> layout size) cannot animate
  img.style.transition = "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  applyTransform(img);
  if (zoomLevel > HIRES_ZOOM) upgradeToOriginal();

  overlay?.classList.add("zoomed");
  toggleNavVisibility(false);
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

  let nextPanX = panX;
  let nextPanY = panY;
  if (cx !== undefined && cy !== undefined) {
    // transform = scale(z) translate(pan) about the layout centre O, so the
    // image centre sits at O + z*pan and the cursor's image point is
    // dx/prevLevel from it. Keep that point under the cursor:
    //   O + newLevel*(pan' + dx/prevLevel) = O + prevLevel*pan + dx
    const [ox, oy] = layoutCentre(img);
    const dx = cx - (ox + prevLevel * panX);
    const dy = cy - (oy + prevLevel * panY);
    nextPanX = (prevLevel * panX + dx) / newLevel - dx / prevLevel;
    nextPanY = (prevLevel * panY + dy) / newLevel - dy / prevLevel;
  }
  setZoom(img, newLevel, nextPanX, nextPanY);
}

function zoomOut(img: HTMLImageElement): void {
  window.clearTimeout(settleTimer);
  uncommit(img);
  zoomLevel = MIN_ZOOM;
  panX = 0;
  panY = 0;
  img.style.cursor = "zoom-in";
  img.style.transform = "";

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
  zoomBtn.setAttribute("aria-label", isZoomed() ? "Zoom out" : "Zoom in");
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
    <button type="button" class="lightbox-close" aria-label="Close lightbox">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <button type="button" class="lightbox-zoom" aria-label="Zoom in">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <button type="button" class="lightbox-prev" aria-label="Previous image">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <button type="button" class="lightbox-next" aria-label="Next image">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
    </button>
    <img class="lightbox-img" alt="" />
    <div class="lightbox-counter" aria-live="polite" aria-atomic="true"></div>
  `;
  document.body.appendChild(el);
  return el;
}

// --------------- Image sources ---------------

/**
 * Viewport-sized resize for image.erfi.io originals (multi-MB JPEGs);
 * any other URL is returned unchanged.
 */
function displaySrc(src: string): string {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  if (url.hostname !== RESIZE_HOST || url.pathname.startsWith("/cdn-cgi/")) {
    return src;
  }
  const longest =
    Math.max(window.innerWidth, window.innerHeight) *
    Math.min(window.devicePixelRatio || 1, 2);
  const width =
    RESIZE_WIDTHS.find((w) => w >= longest) ??
    RESIZE_WIDTHS[RESIZE_WIDTHS.length - 1];
  return `${url.origin}/cdn-cgi/image/width=${width},fit=scale-down,format=auto,quality=85${url.pathname}`;
}

/** Swap in the original once it has decoded, if still on the same image. */
function upgradeToOriginal(): void {
  if (!imgEl || images.length === 0) return;
  const original = images[currentIndex].src;
  if (imgEl.getAttribute("src") === original || upgrading === original) return;
  upgrading = original;
  const index = currentIndex;
  const hi = new Image();
  hi.src = original;
  hi.decode()
    .then(() => {
      if (imgEl && currentIndex === index) imgEl.src = original;
    })
    .catch(() => undefined)
    .finally(() => {
      if (upgrading === original) upgrading = "";
    });
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

    let faded = false;
    const onFaded = () => {
      if (faded) return;
      faded = true;
      el.removeEventListener("transitionend", onFaded);
      el.src = displaySrc(img.src);
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
    // Safety net: ensure onFaded fires even if transitionend does not
    setTimeout(onFaded, 200);
  } else {
    imgEl.src = displaySrc(img.src);
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
  img.src = displaySrc(images[index].src);
}

// --------------- Open / Close ---------------

function open(index: number, trigger?: HTMLElement): void {
  returnFocusTo =
    trigger ?? (document.activeElement as HTMLElement | null) ?? null;
  if (!overlay) {
    overlayController = new AbortController();
    overlay = createOverlay();
    imgEl = overlay.querySelector<HTMLImageElement>(".lightbox-img");
    bindOverlayEvents(overlay);
  }
  showImage(index, false);

  void overlay.offsetHeight;
  overlay.classList.add("lightbox-visible");
  lockScroll();
  overlay
    .querySelector<HTMLButtonElement>(".lightbox-close")
    ?.focus({ preventScroll: true });

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
  unlockScroll();
  returnFocusTo?.focus({ preventScroll: true });
  returnFocusTo = null;
}

/** Hide page scroll; pad by the scrollbar width so the page does not shift. */
function lockScroll(): void {
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  document.body.style.overflow = "hidden";
}

function unlockScroll(): void {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

// --------------- Events ---------------

function bindOverlayEvents(el: HTMLDivElement): void {
  const img = el.querySelector<HTMLImageElement>(".lightbox-img")!;
  const docSignal = overlayController?.signal;

  // iOS Safari: its own pinch gesture would zoom the page under the overlay
  document.addEventListener(
    "gesturestart",
    (e) => {
      if (overlay?.classList.contains("lightbox-visible")) e.preventDefault();
    },
    { signal: docSignal },
  );

  // Resized variant failed (resizing unavailable, bad path): use the original
  img.addEventListener("error", () => {
    const original = images[currentIndex]?.src;
    if (original && img.getAttribute("src") !== original) img.src = original;
  });

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
    // A double-click fires two clicks; only the first one steps the zoom
    if (e.detail > 1) return;
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

  // Bind mousemove/mouseup to document so drag continues if cursor leaves image
  document.addEventListener(
    "mousemove",
    (e) => {
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
    },
    { signal: docSignal },
  );

  document.addEventListener(
    "mouseup",
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      isDragging = false;
      if (isZoomed()) img.style.cursor = "grab";

      setTimeout(() => {
        hasDragged = false;
        img.classList.remove("dragging");
      }, 100);
    },
    { signal: docSignal },
  );

  // ── Touch: swipe (1x) / pan (zoomed) / pinch ──
  el.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isDragging = false;
        pinchStartDist = getPinchDist(e) || 1;
        pinchStartZoom = zoomLevel;
        const [ox, oy] = layoutCentre(img);
        const [mx, my] = getPinchMid(e);
        // mid = O + z*(point + pan)  =>  point = (mid - O)/z - pan
        pinchPointX = (mx - ox) / zoomLevel - panX;
        pinchPointY = (my - oy) / zoomLevel - panY;
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
        const level = Math.max(
          MIN_ZOOM,
          Math.min(
            MAX_ZOOM,
            (pinchStartZoom * getPinchDist(e)) / pinchStartDist,
          ),
        );
        const [ox, oy] = layoutCentre(img);
        const [mx, my] = getPinchMid(e);
        // Keep the image point that started under the fingers under them
        pinchPending = [
          level,
          (mx - ox) / level - pinchPointX,
          (my - oy) / level - pinchPointY,
        ];
        if (!pinchRafId) {
          pinchRafId = requestAnimationFrame(() => {
            pinchRafId = 0;
            if (pinchPending) setZoom(img, ...pinchPending);
            pinchPending = null;
          });
        }
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
  let pendingWheelLog = 0; // accumulated ln(zoom factor) this frame
  let pendingWheelCx = 0;
  let pendingWheelCy = 0;

  el.addEventListener(
    "wheel",
    (e) => {
      if (!overlay?.classList.contains("lightbox-visible")) return;
      e.preventDefault();
      // Horizontal two-finger swipes are not zoom input
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const px =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      pendingWheelLog -=
        px * (e.ctrlKey ? PINCH_ZOOM_PER_PX : WHEEL_ZOOM_PER_PX);
      pendingWheelCx = e.clientX;
      pendingWheelCy = e.clientY;

      if (!wheelRafId) {
        wheelRafId = requestAnimationFrame(() => {
          wheelRafId = 0;
          const level = zoomLevel * Math.exp(pendingWheelLog);
          pendingWheelLog = 0;
          applyZoom(img, level, pendingWheelCx, pendingWheelCy);
        });
      }
    },
    { passive: false },
  );
}

function getPinchMid(e: TouchEvent): [number, number] {
  const [t1, t2] = [e.touches[0], e.touches[1]];
  return [(t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2];
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
    case "Tab": {
      // Keep focus inside the dialog; skip controls hidden while zoomed
      const items = Array.from(
        overlay.querySelectorAll<HTMLElement>("button"),
      ).filter((b) => b.style.pointerEvents !== "none");
      if (items.length === 0) break;
      e.preventDefault();
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey
        ? i <= 0
          ? items.length - 1
          : i - 1
        : i === -1 || i === items.length - 1
          ? 0
          : i + 1;
      items[next].focus();
      break;
    }
  }
}

// --------------- Cleanup ---------------

function destroy(): void {
  if (linkController) {
    linkController.abort();
    linkController = null;
  }
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
    keydownHandler = null;
  }

  if (overlayController) {
    overlayController.abort();
    overlayController = null;
  }
  if (overlay?.classList.contains("lightbox-visible")) unlockScroll();
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  returnFocusTo = null;
  upgrading = "";
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
  if (pinchRafId) {
    cancelAnimationFrame(pinchRafId);
    pinchRafId = 0;
  }
  pinchPending = null;
  window.clearTimeout(settleTimer);
  committed = false;
}

// --------------- Init ---------------

function initialize(): void {
  destroy();

  const links = document.querySelectorAll<HTMLAnchorElement>("a.lightbox-link");
  images = Array.from(links).map((link) => ({
    src: link.href,
    alt: link.querySelector("img")?.alt ?? "",
  }));

  if (images.length === 0) return;

  linkController = new AbortController();
  links.forEach((link, i) => {
    link.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        open(i, link);
      },
      { signal: linkController!.signal },
    );
  });

  keydownHandler = onKeyDown;
  document.addEventListener("keydown", keydownHandler);
}

document.addEventListener("astro:page-load", initialize);
