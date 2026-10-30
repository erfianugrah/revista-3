# Lightbox comparison: revista-3 vs GLSSWRKS product gallery

> Last verified: 2026-10-30. Subjects: `src/scripts/lightbox.ts` + `src/styles/lightbox.css` at b6a3706 (live https://www.erfianugrah.com/long_form/adam/), and the Vue gallery/lightbox component in `_nuxt/CAiEnZTW.js` on https://glsswrks.gg/products/polarity-series (Nuxt on Vercel, Vue 3.5.27, Shopify headless).

Raw research: [raw/2026-10-30-lightbox-comparison/](raw/2026-10-30-lightbox-comparison/) (`revista-audit.md`, `glsswrks-audit.md` - worker dumps; two of their claims are corrected below). The pretty-printed GLSSWRKS chunk is third-party code and stays local only (`~/.local/state/agent-work/lightbox-comparison/glsswrks-pretty.js`, local only, not in the repo).

## Verdict

- The two lightboxes solve different problems. GLSSWRKS is a scroll-snap strip with no zoom at all; revista is a single-image viewer whose main feature is zoom/pan.
- Revista's zoom architecture (one `scale()` + `translate3d()` transform, rAF-throttled, `will-change` only while zoomed, `touch-action: none` on the overlay) is what GLSSWRKS lacks, and the pattern ports to Vue.
- Revista has its own defects, two of them user-visible on every zoom: the cursor anchor is inverted, and the wheel handler ignores delta size (a small trackpad pinch jumps to 5x). It also downloads a 3.26 MB original JPEG on every open, plus two neighbours.

## Feature matrix

| Area                           | revista-3                                              | GLSSWRKS                                                                           |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Structure                      | one `<img>`, crossfade on prev/next                    | horizontal scroll-snap strip of all images (`snap-x snap-mandatory scroll-smooth`) |
| Library                        | none (vanilla TS)                                      | none (Vue SFC)                                                                     |
| Zoom                           | click cycle, wheel, touch pinch, button; max 5x        | none; only the browser's own page zoom                                             |
| Pan when zoomed                | mouse + touch drag, rAF-throttled, unclamped           | n/a                                                                                |
| Prev/next                      | buttons, arrows, swipe, wraps                          | buttons + arrows + native swipe, stops at ends (buttons vanish)                    |
| Close                          | button, backdrop, Escape                               | button, backdrop, Escape                                                           |
| Back button closes             | no                                                     | no                                                                                 |
| Image in lightbox              | original via `link.href` (adam_1.jpg 3,256,327 B JPEG) | Shopify srcset 720-2000w, `sizes="90vw"`                                           |
| Hi-res on zoom                 | always hi-res (never anything else)                    | never                                                                              |
| Neighbour preload              | yes, both neighbours, full originals                   | `loading="lazy"` on strip images                                                   |
| Overlay                        | `rgba(0,0,0,.94)`, no blur                             | `bg-black/90 backdrop-blur-sm` full-screen                                         |
| Dialog semantics               | `role="dialog"` `aria-modal` `aria-label`              | none                                                                               |
| Focus on open / trap / restore | none / none / none                                     | none / none / none, plus `focus:outline-none` on every control                     |
| Counter live region            | no                                                     | no counter                                                                         |
| Reduced motion                 | ignored                                                | ignored                                                                            |
| Scroll lock                    | `overflow:hidden`, no gutter compensation              | same, restore deferred one rAF                                                     |
| Mobile pinch on images         | handled by own JS (`touch-action: none`)               | blocked: strip is `touch-action: pan-x`, gallery `pan-x pan-y`                     |

## Verified findings

Each was reproduced in Playwright (system Chromium; Playwright Firefox 1511 for the GLSSWRKS race) unless marked code-read.

### revista-3

1. **Zoom anchor is inverted** (`lightbox.ts:96-112`). The transform is `scale(z) translate3d(p)`, so the image centre sits at `z*pan` and the fixed-point update must be `pan' = (dx + z_prev*pan)/z_new - dx/z_prev`. The code uses `pan + dx/z_prev - dx/z_new`, the opposite sign on the `dx` term. Measured on adam_1 with the cursor near the right edge: five wheel-in steps (to 2.01x) moved the image point under the cursor from u=1.05 to u=0.57; a centre zoom with no anchoring would end at u=0.773, so the anchor is worse than none. The corrected formula held the point at u=1.0495, v=0.3188 for all five steps. (The worker audit called this maths correct; it is not.)
2. **Wheel ignores delta size and axis** (`lightbox.ts:463-480`). `e.deltaY < 0 ? zoom*1.15 : zoom/1.15`, one step per frame regardless of magnitude or `deltaMode`. Twelve frames of `ctrlKey` wheel at deltaY -1.5 (the shape of a small trackpad pinch) went 1x -> 5x. A horizontal two-finger swipe (deltaY 0) zooms out: 5 frames took 5x -> 2.49x. Fix: `zoom *= Math.exp(-deltaY * k)` with deltas accumulated per frame and `deltaMode` normalised; ignore events with `|deltaY| < |deltaX|`.
3. **Pan is unclamped** (`lightbox.ts:347-348`, `419-420`, code-read): the image can be dragged entirely off-screen; only zoom-out recovers it. Clamp pan so the image edge cannot pass the viewport centre (or edge).
4. **Original JPEG on every open** (code + HEAD): adam_1/2/3 are 3,256,327 / 3,329,690 / 3,229,341 B, and `preload()` fetches both neighbours, 9.8 MB for one open. The masonry thumbnails are AVIF. `image.erfi.io` serves Cloudflare Image Resizing: `/cdn-cgi/image/width=1920,format=avif,quality=80/adam_1.jpg` returned 151,309 B (21.5x smaller). Open on a ~2048 px AVIF, swap to the original once zoom passes ~1.5x.
5. **Document listeners leak** (`lightbox.ts:340`, `363`, code-read): `mousemove`/`mouseup` on `document` are added on every `initialize()` (each `astro:page-load`) and never removed in `destroy()`. Attach them to the existing `AbortController` signal.
6. **Dead guard** (`lightbox.ts:306`, code-read): checks `dragging-nav`, which nothing ever adds.
7. **Forced style flush per pinch event**: `applyZoom` reads `getBoundingClientRect()` on every touchmove (the pinch path is not rAF-throttled). Measured: 52-53 layouts per synthetic pinch (103 frames, 1.72 s), 2.4-2.7 ms layout total, frame p95 16.7-16.8 ms (3 runs, SwiftShader). Cheap today; tracking the image centre from state instead of the DOM removes it and makes the header comment ("no layout recalculation") true.
8. **Accessibility gaps** (code-read): no focus move on open, no focus trap, no focus restore, counter not `aria-live`, no `prefers-reduced-motion` handling (HeroImage.astro already respects it), no `scrollbar-gutter`/padding compensation on scroll lock.
9. **Test gaps**: `tests/lightbox.spec.ts` has 6 tests; the drag test has no assertion. Nothing covers zoom anchoring, wheel magnitude, pan bounds, focus, or listener count across navigations. Findings 1-2 are directly testable with the probe used here (compare the image fraction under the cursor before and after wheel steps).

### GLSSWRKS

1. **No zoom implementation.** No wheel, pinch, pointer or transform code in the component. On desktop any "zoom" is the browser's: trackpad pinch (sent as a `ctrlKey` wheel event, per MDN `/docs/mdn/web/api/mouseevent/ctrlkey/index.md`) and Ctrl+scroll zoom the whole page under a full-screen `backdrop-blur-sm` overlay. That blur is recomputed as the page scales, at 90% black where it is barely visible. The lag cause is probable, not measured: headless Chromium here renders on SwiftShader (no GPU), and synthetic pinch did not zoom the visual viewport even on plain text, so no frame-time comparison was possible.
2. **Pinch-zoom blocked on phones.** Computed `touch-action` is `pan-x` on the lightbox strip and `pan-x pan-y` on the gallery. Per MDN (`/docs/mdn/web/css/reference/properties/touch-action/index.md`) `pinch-zoom` must be listed explicitly alongside pan keywords, so neither element allows it: users cannot pinch product photos on mobile. Not observed on a device. (The worker audit claimed `touch-action` preserves pinch-zoom; per the spec it does not.)
3. **Wrong image on open after a resize** (Firefox 1511 and Chromium). Open = `nextTick(() => { scrollTo(index, "auto"); observe(); })`; `"auto"` honours CSS `scroll-smooth`, so the IntersectionObserver's first callback sees slide 0 fully visible and resets the index; a `resize` within ~100 ms (debounced 150 ms) then snaps to that index. Clicking image 4 opened on 4 (no resize), 2 (resize at 0 ms), 3 (50 ms, 100 ms), 4 (200 ms+). Fix: scroll with `behavior: "instant"` on open and start observing after `scrollend`.
4. **Gallery active index ignores `intersectionRatio`** (code-read): the lightbox observer checks `ratio >= .5`, the gallery observer (threshold .2 on mobile) only `isIntersecting`, which stays true for a slide leaving view. Did not misfire in Chromium tests (taps 150-900 ms apart); a latent bug.
5. **No dialog semantics, no focus handling, focus rings removed** (`focus:outline-none` on every control).
6. **Dead ends**: lightbox Prev/Next vanish and arrow keys do nothing at the ends, while the mobile gallery wraps.

## What revista-3 should change

> Outcome 2026-10-30: items 1-6 shipped in 4673fd0 with 11 new Playwright specs (`tests/lightbox.spec.ts`); item 7 (state-derived image centre, double-click double-step) shipped later the same day together with a commit-to-layout zoom (scale() during gestures, real width/height once idle): PSNR against a Lanczos render of the original went from 37.18 dB to 50.39 dB in Chromium (2 runs each, identical), with the settled translate rounded to device pixels (unrounded: 46.35 dB).

Ordered by user impact. Cards are listed at the end of this doc.

1. Fix the zoom anchor formula (finding 1) and add a regression test for it.
2. Make wheel zoom delta-proportional, axis-aware and `deltaMode`-normalised (finding 2). Optional: plain wheel pans when zoomed, `ctrlKey` wheel zooms, matching trackpad conventions.
3. Clamp pan (finding 3).
4. Serve resized AVIF on open, original on deep zoom, and preload neighbours at the resized size (finding 4).
5. Move document drag listeners onto the AbortController; delete the dead guard (findings 5-6).
6. Focus management, `aria-live` counter, reduced motion, scrollbar compensation (finding 8).
7. Smaller: derive the image centre from state rather than `getBoundingClientRect` (finding 7); double-click zooms two steps (two clicks fire first).

## What GLSSWRKS needs

1. **A zoom mode in the lightbox.** Port revista's approach to the active slide: one transform `scale(z) translate3d(x, y, 0)`, wheel/ctrl-wheel and two-pointer pinch handled in JS with `touch-action: none` on the zoomed slide, rAF-throttled, `will-change` only while zoomed, pan clamped, strip scrolling disabled while zoomed (`overflow: hidden` on the strip), reset on slide change. Take the corrected anchor formula, not revista's current one. Revista is MIT-licensed.
2. **Upgrade resolution on zoom**: their helper caps the lightbox at 2000 w with `sizes="90vw"`; past 1.5x swap `src` to a larger Shopify width or the original.
3. **Drop `backdrop-blur-sm`** on the overlay (90% black hides it); the cheapest change for zoom smoothness.
4. **Allow pinch on phones** until in-lightbox zoom exists: `touch-action: pan-x pinch-zoom` on the strip, `manipulation` on the gallery.
5. **Fix the open race**: `behavior: "instant"`, observe after `scrollend`; check `intersectionRatio` in the gallery observer.
6. Dialog role, `aria-modal`, focus move/trap/restore, visible focus rings, consistent wrap behaviour.

## Limits

- No frame-time numbers for GLSSWRKS zoom (SwiftShader rendering; synthetic pinch did not drive page zoom). The blur/lag link is reasoning, not measurement.
- Zen itself was not driven; Firefox results come from Playwright's Firefox 1511 build.
- revista performance counts come from 3 runs of one synthetic pinch on one page; they show absence of jank under software rendering, not GPU timings.

Cards: revista-3#3 (zoom/pan bugs + tests), revista-3#4 (resized AVIF on open), revista-3#5 (accessibility).
