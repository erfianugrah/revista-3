# Revista-3 custom lightbox audit

Read-only code audit. No source files modified, nothing committed, no dev server/build run.

Files audited:
- `src/scripts/lightbox.ts` (569 lines) - all logic
- `src/styles/lightbox.css` (219 lines)
- `src/components/Masonry.astro` (74 lines) - trigger markup
- `src/layouts/AuthorLayout.astro`, `src/layouts/MarkdownPostLayout.astro` - CSS wiring only (both `import "../styles/lightbox.css"`, lines 3)
- `tests/lightbox.spec.ts` (6 tests)

Wiring: `lightbox.css` is imported globally by both content layouts (so styles ship on every post/author page). `lightbox.ts` is only loaded by `Masonry.astro` (`<script src="../scripts/lightbox.ts">`, line 74), which is used by 19 MDX posts. Site is Astro 7.4.1 with `ClientRouter` (View Transitions) enabled (`src/layouts/BaseLayout.astro:2,201`). Live page confirmed at https://www.erfianugrah.com/long_form/adam/.

---

## 1. Open/close

- **Trigger**: `<a href={image.src} class="image-link lightbox-link">` wrapping an optimized AVIF `<img>` (`src/components/Masonry.astro:57-70`). Click handler in `initialize()` calls `e.preventDefault(); open(i)` (`lightbox.ts:556-559`). Anchors are natively keyboard-reachable.
- **Open animation**: overlay fades in via `.lightbox-visible` (opacity/visibility/background, 0.35s; `lightbox.css:22-25`). Image scales `scale(0.92) -> scale(1)` over 0.4s (`lightbox.css:31-57`). `open()` forces a reflow with `void overlay.offsetHeight` then adds the class (`lightbox.ts:253-255`).
- **FLIP/origin animation from thumbnail**: NO. The image scales from a fixed `scale(0.92)` centered in the viewport, not from the thumbnail's on-page position/size. No FLIP, no transform-origin computed from the clicked element.
- **Close**: close button, Escape, and backdrop click where `e.target === el && !hasDragged` (`lightbox.ts:283-285`). Backdrop click is intentionally suppressed for 100ms after a drag (`lightbox.ts:369-372`).
- **Browser Back / history**: NONE. No `history.pushState`/`popstate`. Pressing Back navigates away from the whole page, losing lightbox state. Not an SPA-route-friendly lightbox.

---

## 2. Navigation

- **Prev/next buttons**: yes (`lightbox.ts:276-280`).
- **Keyboard**: `ArrowLeft`/`ArrowRight`/`Escape` in `onKeyDown` (`lightbox.ts:491-505`). Arrows are ignored while zoomed (correct).
- **Touch swipe**: 1-finger horizontal swipe when not zoomed, threshold 50px (`lightbox.ts:447-453`). Only left/right.
- **Wheel**: wheel is used for ZOOM, not navigation (`lightbox.ts:453-475`). No horizontal-wheel navigation. Acceptable design choice; note the wheel handler `preventDefault()`s unconditionally while open.
- **Loop/wrap**: yes, modulo wrap `((index % images.length) + images.length) % images.length` (`lightbox.ts:202-203`).
- **Counter**: yes, "1 / 4" via `counter.textContent` (`lightbox.ts:231-234`). Hidden when zoomed by `toggleNavVisibility` (`lightbox.ts:133-144`).
- **Thumbnail strip**: NONE.

---

## 3. Zoom

- **Levels/steps/max**: click cycles 1x -> 2x -> 3.5x -> reset (`lightbox.ts:302-319`). Zoom button toggles 1x <-> 2x (`lightbox.ts:287-295`). Wheel steps 1.15x per tick (`lightbox.ts:29,468-471`). Pinch continuous. `MAX_ZOOM = 5` (`lightbox.ts:28`).
- **Input methods**: image click (cycle), zoom button, wheel, ctrl+wheel / trackpad pinch (same wheel path via `e.deltaY`), touch pinch (2-finger). No dedicated `dblclick` handler - a double-click fires two click events, so it zooms 1x -> 2x -> 3.5x in one gesture rather than a single "zoom to fit" step.
- **Anchor point maths**: cursor-anchored via `applyZoom(cx, cy)` (`lightbox.ts:96-112`). Maths is correct: `pan += dx/prev - dx/new`. [PARENT CORRECTION 2026-10-30: wrong - sign of the dx term is inverted; measured drift u 1.05 -> 0.57 over 5 wheel steps. See ../../2026-10-30-lightbox-comparison.md finding 1.] But it reads `img.getBoundingClientRect()` every frame (`lightbox.ts:99`) - see Performance.
- **Pan/drag**: mouse drag when zoomed (`lightbox.ts:326-373`), 1-finger touch drag when zoomed (`lightbox.ts:396-424`). Delta divided by zoomLevel so pan is screen-accurate.
- **Pan bounds clamping**: NONE. `panX`/`panY` are set with no min/max (`lightbox.ts:347-348` mouse, `419-420` touch). The image can be dragged entirely off-screen and lost; the only recovery is zoom-out (which resets pan, `lightbox.ts:120-122`).
- **Inertia**: NONE. No momentum/flick on pan or pinch; motion stops dead on release.
- **Reset on navigate/close**: yes. `showImage` calls `zoomOut` before switching if zoomed (`lightbox.ts:198`); `close()` calls `zoomOut` (`lightbox.ts:268`).

---

## 4. Images

- **URL/resolution**: the lightbox loads `link.href`, i.e. the RAW original URL from the MDX frontmatter (`lightbox.ts:547`). Live check: `https://image.erfi.io/adam_1.jpg` is a 3,256,327-byte full-res JPEG (confirmed via `Content-Range: bytes 0-0/3256327`). The masonry thumbnail is an optimized 1920x1080 AVIF (`/assets/adam_1_*.avif`), but the lightbox ignores it entirely.
- **srcset/sizes**: NONE. Single fixed `src`.
- **Higher-res swap on zoom**: N/A - the full-res original is loaded unconditionally from open, even if the user never zooms. The opposite of lazy high-res.
- **Neighbour preloading**: yes, `preload()` creates `new Image()` for prev/next (`lightbox.ts:236-242`). Relies on browser cache; no explicit `decode()`.
- **`img.decode()` before showing**: NO. `decoding` attribute is set on the thumbnail (`Masonry.astro:62`) but not on the lightbox `<img>`; no `decode()` anywhere in `lightbox.ts`.
- **Placeholder/spinner**: NONE. On open the fade-in runs on an empty/partially-loaded 3MB image (black screen until it arrives).
- **Error handling**: NONE. No `error` listener, no `onerror`, no fallback. A 403/404 full-res URL leaves a broken image / empty box silently.

---

## 5. Performance

- **Transform-only animation**: zoom/pan are a single `transform: scale() translate3d()` (`lightbox.ts:71-76`), compositor-only. Good.
- **will-change**: deferred and conditional - `.lightbox-visible .lightbox-img` gets `will-change: transform, opacity`, `.lightbox-overlay.zoomed .lightbox-img` gets `will-change: transform` (`lightbox.css:47-59`). Avoids holding a full-res GPU texture at rest. Good.
- **backdrop-filter**: `blur(8px)` on the four buttons only (`lightbox.css:86-88`), not the overlay. Low cost.
- **Passive listeners**: `touchstart`/`touchmove`/`wheel` are `{passive: false}` because they `preventDefault()` (needed). `mousemove`/`mouseup` on `document` are default (non-passive) but only `preventDefault()` trivially.
- **rAF throttling**: `dragRafId` for pan (`lightbox.ts:353-360`) and `wheelRafId` for wheel (`lightbox.ts:472-478`). Good.
- **Resize handling**: NONE. No `resize`/`orientationchange` listener; zoom/pan state survives a resize unadjusted.
- **Layout in hot path**: `getBoundingClientRect()` is read once per wheel/pinch frame inside `applyZoom` (`lightbox.ts:99`). The file header claims "no layout recalculation on zoom or drag" (`lightbox.ts:9-11`) - false: `getBoundingClientRect` forces a layout read each zoom frame. Cost is bounded (once per rAF, and the image is fixed/flex-centered so layout is stable), but the comment is wrong and it is not "pure compositor".

---

## 6. Accessibility

- **role/aria-modal/aria-label**: present - `role="dialog"`, `aria-modal="true"`, `aria-label="Image lightbox"` (`lightbox.ts:159-161`); per-button `aria-label` (`lightbox.ts:163-172`). Good.
- **Focus on open**: NONE. Focus stays on the trigger link, now behind the overlay. No `focus()` on the dialog or close button.
- **Focus trap**: NONE. Tab walks through the page behind the modal.
- **Focus restore**: NONE (no explicit restore; focus happens to remain on the trigger, but this is incidental, not managed).
- **Alt text carried over**: yes, `link.querySelector("img")?.alt` -> `el.alt = img.alt` (`lightbox.ts:548,206`).
- **Live region for counter**: NONE. Counter is a plain `<div>` (`lightbox.ts:176`), text set with `textContent` (`lightbox.ts:233`), no `aria-live`.
- **prefers-reduced-motion**: NONE in the lightbox. `lightbox.css` has no `@media (prefers-reduced-motion)` and `lightbox.ts` has no matchMedia check - despite `HeroImage.astro` respecting it elsewhere in the same codebase (`src/components/HeroImage.astro:112`).
- **Button types**: buttons lack explicit `type="button"` (`lightbox.ts:163-172`). Defaults to `type="submit"`; harmless (no form) but a lint-level nit.
- **Triggers keyboard-reachable**: yes, real `<a>` elements (`Masonry.astro:57`).

---

## 7. Scroll lock

- **Mechanism**: `document.body.style.overflow = "hidden"` on open, reset to `""` on close (`lightbox.ts:257,274`).
- **Layout shift from scrollbar removal**: unhandled. No `scrollbar-gutter: stable` and no scrollbar-width compensation. On Windows/Linux classic scrollbars the page reflows ~15px on open/close. (macOS overlay scrollbars hide this.)
- **iOS**: `overflow: hidden` on body is unreliable on iOS Safari; the mitigation is `touch-action: none` on `.lightbox-overlay` (`lightbox.css:18`) which blocks scroll-behind over the overlay area. No `position: fixed` body lock or `overscroll-behavior` fallback; background rubber-band still possible.

---

## 8. Lifecycle

- **Cleanup**: `destroy()` aborts the link `AbortController` and removes the `keydown` listener, and removes the overlay (`lightbox.ts:511-536`). `initialize()` calls `destroy()` first (`lightbox.ts:543`), so re-init on `astro:page-load` is clean for links/keydown/overlay.
- **View Transitions**: `document.addEventListener("astro:page-load", initialize)` (`lightbox.ts:569`) - correct pattern for ClientRouter swaps.
- **Double-init**: prevented by the `destroy()`-first guard.
- **Memory leaks**: the `document`-level `mousemove` (`lightbox.ts:340`) and `mouseup` (`lightbox.ts:363`) listeners are added inside `bindOverlayEvents` (once per overlay creation) but are NEVER removed - `destroy()` removes the overlay but not these two document listeners. Across repeated ClientRouter navigations (each `astro:page-load` -> `destroy` -> next `open` recreates the overlay and re-runs `bindOverlayEvents`) they accumulate. Each is a cheap early-return no-op, but the count grows unbounded.

---

## 9. Mobile

- **touch-action**: `touch-action: none` on `.lightbox-overlay` (`lightbox.css:18`). Correct for suppressing native gestures; JS pinch/pan takes over.
- **Swipe-to-close**: NONE. Swipe left/right navigates; no vertical swipe-down-to-close.
- **Safe-area insets**: NONE. No `env(safe-area-inset-*)`. Close/zoom buttons at `top:20px/right:20px` (`lightbox.css:121-135`) sit under the notch in iOS landscape; counter at `bottom:20px` (`lightbox.css:164-180`) can sit under the home indicator.
- **iOS Safari quirks**: no `gesturestart`/`gesturechange` guard. `touch-action: none` + `preventDefault` on 2-finger `touchmove` (`lightbox.ts:399-408`) suppresses native pinch in practice, but there is no explicit iOS gesture-event handling. Also no `-webkit-tap-highlight-color` on buttons (set only on overlay, `lightbox.css:20`).

---

## 10. Bugs and risks

Ranked by user impact.

1. **No pan bounds clamping** - `lightbox.ts:347-348,419-420`. Image can be dragged fully off-screen and lost; only recovery is zoom-out. Fix: clamp `panX`/`panY` to `[-maxPan, +maxPan]` derived from image rendered size and zoomLevel, recomputed on zoom/resize.
2. **Loads full-res original unconditionally** - `lightbox.ts:547` + `Masonry.astro:57`. 3.2MB JPEG on open even without zoom, no srcset/sizes, no size-capped variant. Slow on mobile/limited data. Fix: load the AVIF thumbnail-sized image first and swap to a larger variant only when zoomed; or add `srcset`/`sizes`.
3. **No image error handling** - `lightbox.ts` (no `error` listener). A dead full-res URL shows a broken/blank image silently. Fix: `imgEl.addEventListener("error", ...)` with a placeholder or skip-to-next.
4. **No focus management** - no focus on open, no trap, no restore (`lightbox.ts:247-265`, `open()` never calls `focus()`). Screen-reader/keyboard users tab into the page behind the modal. Fix: focus the dialog/close button on open, trap Tab within overlay, restore focus to trigger on close.
5. **Fade-in on unloaded image (no spinner/decode)** - `lightbox.ts:253` sets src then fades without `decode()`/load-wait; combined with issue 2 the open animation plays over an empty image. Fix: wait for `img.decode()` before adding `.lightbox-visible`, with a spinner.
6. **No prefers-reduced-motion** - `lightbox.css` + `lightbox.ts` ignore it, while `HeroImage.astro:112` respects it. Fix: `@media (prefers-reduced-motion: reduce)` disabling the scale/fade, and a JS matchMedia gate on the open/zoom transitions.
7. **Scrollbar layout shift** - `lightbox.ts:257` sets `overflow: hidden` with no `scrollbar-gutter` compensation. Fix: `scrollbar-gutter: stable` on `html` or add scrollbar-width padding when locking.
8. **Document listener leak** - `lightbox.ts:340,363` never removed in `destroy()`. Fix: store the handlers and remove them, or bind to the overlay instead of `document`.
9. **Dead `dragging-nav` guard** - `lightbox.ts:306` checks `el.classList.contains("dragging-nav")` but the class is never added anywhere (grep confirms). The intended "swipe navigated, ignore the follow-up tap" guard never fires; a tap synthesized after a near-threshold swipe can immediately zoom. Fix: add/remove `dragging-nav` in the swipe path, or delete the dead check.
10. **Counter not `aria-live`** - `lightbox.ts:176,233`. Screen readers don't announce image changes. Fix: `aria-live="polite"` on the counter (or an off-screen live region).
11. **No Back/history integration** - `lightbox.ts` has no `pushState`/`popstate`. Back button exits the site section entirely. Fix (optional): push a hash/state on open and pop on close.
12. **No resize/orientation handling** - zoom/pan survive a viewport change unadjusted, and unclamped pan (issue 1) is not re-bounded. Fix: reset or clamp on `resize`.
13. **`getBoundingClientRect` in zoom hot path** - `lightbox.ts:99`, contradicting the "pure compositor" claim in the header (`lightbox.ts:9-11`). Fix: compute the anchor from the known flex-centered layout (or cache rect) to keep the hot path layout-free.
14. **Double-click zooms two steps** - no `dblclick` handler; a double-click is two clicks -> 1x -> 2x -> 3.5x (`lightbox.ts:302-319`). Fix: a `dblclick` handler or click-throttle.
15. **Buttons lack `type="button"`** - `lightbox.ts:163-172`. Cosmetic (no form), but standard practice.

### Test coverage gaps (`tests/lightbox.spec.ts`)

Current tests (6): open on click; close via button; close via Escape; drag-state doesn't get stuck (the "B1" test, currently a stub with no assertion - see below); arrow-key navigation changes `src`.

Not covered:
- Backdrop click to close.
- Wheel zoom, click-cycle zoom levels, zoom button toggle, pinch (untestable without touch emulation but swipe is untested too).
- Pan/drag panning and pan bounds (issue 1) - the B1 test only checks drag doesn't stick, not that pan is bounded.
- Preloading / neighbour load.
- Image error handling (issue 3).
- Focus trap / focus restore / focus on open (issue 4).
- `aria-live` counter / `aria-modal` presence.
- `prefers-reduced-motion` (issue 6).
- Scroll lock and scrollbar shift (issue 7).
- Loop/wrap at the ends (first <-> last).
- Counter text correctness.
- Close-while-zoomed (Escape zooms out first, then closes) and Escape-when-zoomed behaviour.
- Swipe navigation (touch) and the `dragging-nav` dead-guard path.
- Lifecycle across ClientRouter navigation (listener leak, issue 8).
- The "B1" test is a stub: it ends with a comment "This test will FAIL until B1 is fixed" and no `expect()` on the overlay state after release - it never asserts anything, so it can't catch the very regression it is named for.

---

## Strengths worth keeping

- **Compositor-only transform zoom/pan** - single `scale()+translate3d()`, rAF-throttled, deferred `will-change`. The core interaction is genuinely jank-free in steady state.
- **Cursor-anchored zoom maths is correct** (`lightbox.ts:96-112`) - the point under the cursor stays put across the scale change.
- **Conditional `will-change`** avoids holding a full-res GPU texture at rest - a real memory win for 3MB portraits.
- **Clean ClientRouter lifecycle** - `astro:page-load` -> `destroy()`-first -> re-init, with `AbortController` for link listeners and explicit keydown removal.
- **Loop/wrap + neighbour preload** are both present and correct.
- **Semantic button/a markup with per-control `aria-label`** - the skeleton is accessible even if focus management is missing.
- **`.lightbox-overlay.zoomed` state scoping** keeps nav-hiding and zoom styles tied to one class toggle.
- **Drag threshold + post-drag backdrop-close suppression** (`hasDragged`, 100ms) correctly prevents accidental close after a pan.
