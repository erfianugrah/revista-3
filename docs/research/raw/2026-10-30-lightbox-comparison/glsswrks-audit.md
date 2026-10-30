# GLSSWRKS Product Gallery + Lightbox -- Reverse-Engineered Audit

**Source:** `https://glsswrks.gg/products/polarity-series`
**Chunk:** `CAiEnZTW.js` (47KB minified, Nuxt 3 / Vue 3.5 production build)
**Pretty-printed:** `glsswrks-pretty.js` (2911 lines)
**Component:** `ShopifyProductGallery` (`$r`, line 262-842)
**Date:** 2026-10-30

---

## Variable Mapping (minified → meaningful)

### Reactive State (`S()` = ref, `d(() => ...)` = computed)

| Minified | Meaning | Type | Init |
|----------|---------|------|------|
| `m` | `scrollContainerRef` | ref | `null` |
| `h` | `lightboxScrollContainerRef` | ref | `null` |
| `k` | `isDesktop` | ref | `false` |
| `$` | `hasScrollbar` | ref | `false` |
| `R` | `canScrollUp` | ref | `false` |
| `G` | `canScrollDown` | ref | `false` |
| `C` | `galleryActiveIndex` | ref | `0` |
| `V` | `lightboxOpen` | ref | `false` |
| `_` | `lightboxIndex` | ref | `0` |
| `z` | `galleryObserver` | let | `null` |
| `E` | `lightboxObserver` | let | `null` |
| `N` | `resizeTimer` | let | `null` |
| `f` | `imageCount` | computed | `g.value.length` |
| `g` | `images` | computed | `Bt(props.images)` |
| `he` | `activeImageIndex` | computed | `props.activeImageIndex ?? findIndex(altText)` |

### Functions

| Minified | Meaning | What it does |
|----------|---------|--------------|
| `Te(u)` | `gallerySrcset(u)` | Returns `{ src, srcset, sizes }` for gallery img |
| `me(u)` | `lightboxSrcset(u)` | Returns `{ src, srcset, sizes }` for lightbox img |
| `be()` | `updateBreakpoint()` | `k.value = window.innerWidth >= 768` |
| `q()` | `updateScrollState()` | Sets `$`, `R`, `G` from scroll position |
| `$e()` | `onScroll()` | Desktop only: calls `q()` |
| `se(u, y)` | `scrollGalleryTo(u, behavior)` | `scrollIntoView` on gallery child at index `u` |
| `Oe(u)` | `isImageVisible(u)` | Checks if child `u` is fully within viewport (+8px padding) |
| `Le(u)` | `scrollToActive(behavior)` | Scrolls gallery to `he.value` if not visible |
| `ce()` | `galleryPrev()` | `se(C - 1)`, wraps to last |
| `Qe()` | `galleryNext()` | `se(C + 1)`, wraps to first |
| `Pe()` | `scrollUp()` | `scrollBy({ top: -240, behavior: "smooth" })` |
| `ze()` | `scrollDown()` | `scrollBy({ top: 240, behavior: "smooth" })` |
| `ye()` | `setupGalleryObserver()` | IntersectionObserver (threshold 0.5 desktop, 0.2 mobile), sets `C` |
| `Xe(u)` | `openLightbox(u)` | Sets `_.value = u`, `V = true`, body `overflow: hidden` |
| `xe()` | `closeLightbox()` | `V = false`, `rAF` → remove body overflow |
| `Me()` | `lightboxPrev()` | `ee(_.value - 1)` if `_.value > 0` |
| `Ae()` | `lightboxNext()` | `ee(_.value + 1)` if `_.value < f - 1` |
| `ee(u, y)` | `scrollLightboxTo(u, behavior)` | Clamps index, `scrollIntoView` on lightbox child |
| `_e(u)` | `handleKeydown(u)` | Escape → close, ArrowLeft → prev, ArrowRight → next |
| `Re(u)` | `lightboxIOEntries(u)` | IO callback: sets `_.value` from visible slide (requires `intersectionRatio >= 0.5`) |
| `Ve()` | `setupLightboxObserver()` | IntersectionObserver (threshold 0.5) on lightbox container |
| `ue()` | `handleResize()` | Debounced 150ms → `ee(_.value, "auto")` |

### Global Utility Functions

| Minified | Meaning |
|----------|---------|
| `At` | Default width array: `[480, 720, 960, 1280, 1600]` |
| `fe(v)` | `trimAndLower(v)` |
| `$t(v)` | `splitTokens(v)` -- splits on non-alphanumeric |
| `Rt(v)` | `parseURL(v)` |
| `Vt(v)` | `isShopifyCDN(v)` -- checks for myshopify.com/cdn.shopify.com with `/cdn/` path |
| `Nt(v, w)` | `setWidthParam(v, w)` -- appends `?width=w` to Shopify CDN URL |
| `_r(v, ws)` | `buildSrcset(v, widths)` -- generates `"url?width=480 480w, url?width=720 720w, ..."` |
| `ut(v, o)` | `buildSrcData(v, opts)` -- returns `{src, srcset, sizes}` |
| `wr(a, b)` | `altTextFuzzyMatch(a, b)` -- token-subset match |
| `kr(imgs, alts)` | `findIndexByAltText(imgs, altTexts)` -- exact then fuzzy |
| `Bt(imgs)` | `normalizeImages(imgs)` -- converts mixed string/object array to `{url, altText}[]` |
| `pe(fn, mods)` | Vue's `withModifiers(fn, mods)` -- e.g. `.stop` |
| `Ie` | Vue's `nextTick` |
| `U` | Vue's `watch` |
| `dt` | Vue's `onMounted` |
| `lr` | Vue's `onUnmounted` |

---

## De-minified Script (readable reconstruction)

Removed from the repo: it is a readable copy of third-party code. Kept at `~/.local/state/agent-work/lightbox-comparison/glsswrks-deminified.md` (local only, not in the repo). Line numbers below refer to `glsswrks-pretty.js` in the same local folder.

## Section Audits

### 1. Open/Close

**Trigger:** Click on any gallery `<button>` (line 557: `onClick: (de) => Xe(I)`), calling `Xe(u)` (line 379). `Xe` sets `lightboxIndex.value = u`, `lightboxOpen.value = true`, `document.body.style.overflow = "hidden"` (lines 379-383).

**Animation:** Vue `<Transition>` with `enterActiveClass: "transition-opacity duration-300 ease-[ease]"` (line 690), `enterFromClass: "opacity-0"`. Same for leave, duration 300ms. No FLIP or transform from thumbnail origin -- the lightbox fades in at final position only.

**Close:** Three triggers:
1. Backdrop click: `div` (line 694) has `onClick: xe` on the fixed overlay
2. Close button: `<button onClick={pe(xe, ["stop"])}>` (line 708), `×` text, `aria-label="Close lightbox"` (line 711)
3. Escape key: `_e()` (line 411) checks `u.key === "Escape"` and calls `xe()`

`xe()` (line 386): sets `V.value = false`, then `requestAnimationFrame(() => document.body.style.removeProperty("overflow"))`. The `rAF` adds one frame of delay before restoring scroll.

**History/back button:** No `history.pushState` or `popstate` handler. Browser back does not close the lightbox.

**Gallery chevrons:** The "Scroll up" / "Scroll down" chevrons are wrapped in `<Transition>` with 200ms opacity (lines 514-519, 596-601). Show condition: `hasScrollbar && canScrollUp/canScrollDown && isDesktop` (lines 519, 602). Hidden on mobile.

### 2. Navigation

**Gallery (desktop):** Vertical chevrons. `scrollUp`/`scrollDown` call `scrollBy({ top: -240/+240, behavior: "smooth" })` (lines 358-361). No wrap-around. Chevrons fade in/out via Transition based on scroll position.

**Gallery (mobile):** Previous/Next buttons. Show condition: `imageCount > 1 && galleryActiveIndex >/< (0 / count-1) && !isDesktop` (lines 630, 660). Call `galleryPrev`/`galleryNext` which WRAP around: `ce()` (line 348): `C > 0 ? C - 1 : imageCount - 1`. `Qe()` (line 353): `C < imageCount - 1 ? C + 1 : 0`. The wrap means both buttons are always visible when `imageCount > 1` because `galleryActiveIndex` is never at a boundary that hides both.

**Lightbox:** Previous/Next buttons. Show condition: `imageCount > 1 && lightboxIndex > 0` / `< imageCount - 1` (lines 777, 807). NO wrap-around -- `lightboxPrev`/`lightboxNext` guard with `<= 0` and `>= imageCount - 1` (lines 392-397). At the ends, the button disappears rather than wrapping.

**Keyboard:** `_e()` (line 411): ArrowLeft → `Me()` (lightboxPrev), ArrowRight → `Ae()` (lightboxNext). Only active when `V.value` (lightbox open) -- line 413. No ArrowUp/ArrowDown handling.

**Swipe:** No swipe gesture handlers. Relies entirely on native CSS scroll-snap (`snap-x snap-mandatory`) on both containers. Users swipe the scroll container directly; there's no programmatic swipe-to-navigate.

**Wheel:** Relies on native scroll. No `wheel` event listener. No prevention of default behavior.

**Loop/wrap:** Gallery mobile buttons wrap (ce/Qe wrap to ends). Lightbox buttons DO NOT wrap. Gallery chevrons do not wrap. Keyboard navigation does not wrap. Gallery IO does not wrap.

**Counter:** None. No "1/5" text anywhere in the component or its parent.

**Thumbnails:** None. The gallery cards ARE the thumbnails (serving dual role).

### 3. Zoom

**No zoom support.** No pinch-zoom, double-click zoom, or wheel-zoom handlers anywhere in the component.

**Browser pinch-zoom:** Page viewport meta is `<meta name="viewport" content="width=device-width, initial-scale=1">` -- no `user-scalable=no` or `maximum-scale` constraint. So browser pinch-zoom works, but there's no integration with the component (no `touch-action: pinch-zoom` classes, no `transform` on the image).

**touch-action on containers:**
- Gallery: `touch-pan-x touch-pan-y` (line 535) -- allows both pan axes and pinch-zoom
- Lightbox: `touch-pan-x` only (line 720) -- allows horizontal pan + pinch-zoom

Neither restricts pinch-zoom, which is good for accessibility but means there's no custom zoom UX. [PARENT CORRECTION 2026-10-30: wrong - per MDN touch-action, pan-x / pan-x pan-y without the pinch-zoom keyword DISABLE pinch-zoom on those elements. See ../../2026-10-30-lightbox-comparison.md GLSSWRKS finding 2.]

### 4. Images

**Gallery images:**
- `srcset` via `ut()` with width params: `?width=480 480w, ?width=720 720w, ?width=960 960w, ?width=1280 1280w, ?width=1600 1600w` (line 283-285)
- `sizes`: `"(min-width: 1280px) 620px, (min-width: 768px) 46vw, 100vw"` (line 286)
- First image: `fetchpriority="high"`, `loading="eager"`, `decoding="sync"` (lines 572-574)
- Others: `fetchpriority="auto"`, `loading="lazy"`, `decoding="async"` (lines 572-574)
- All: `draggable="false"`, `onLoad: q` (recalculates scroll state) (lines 575-576)
- Wrapped in `<button>` elements (line 550)

**Lightbox images:**
- `srcset` via `ut()` with width params: `?width=720 720w, ?width=960 960w, ?width=1280 1280w, ?width=1600 1600w, ?width=2000 2000w` (line 288)
- `sizes`: `"90vw"` (line 291)
- All images: `loading="lazy"`, `decoding="async"` (lines 752-753)
- No `fetchpriority` attribute (defaults to "auto")
- All images are inside `snap-center snap-always` divs (line 741)

**Shopify CDN width params:** `Nt()` (line 186) appends `?width=N` to Shopify CDN URLs. `_r()` (line 194) generates the `srcset` string. Only Shopify URLs (`myshopify.com` / `cdn.shopify.com` with `/cdn/` path) get width params; non-Shopify URLs return the original URL unchanged (line 187).

**Hi-res swap:** None. No `src` → high-res `src` swap on load, no progressive enhancement above the srcset widths. The lightbox uses the highest width (2000w) in srcset but no on-demand full-res fetch.

**Preloading:** First gallery image only (`fetchpriority="high"`, `loading="eager"`). Lightbox images use `loading="lazy"` -- no `<link rel="preload">` or `prefetch` for lightbox images.

**Placeholder:** None. No blurred placeholder, no skeleton, no `background-image` low-res preview. Images appear when loaded.

**Error handling:** None. No `onError` handler, no fallback `src`, no broken-image placeholder.

### 5. Performance

**Layout vs transforms:** Uses native CSS `scroll-snap` and `scrollIntoView()` for all navigation. No `transform: translateX()` or manual animation frames. ScrollIntoView triggers layout but is native and hardware-accelerated on most browsers.

**backdrop-filter:** Lightbox overlay uses `backdrop-blur-sm` (line 697, class string). This is a composited filter that triggers GPU work per frame when content changes behind the overlay. Since the lightbox is full-screen, the backdrop-filter runs over the entire viewport.

**Listeners:**
- `onScroll` on gallery container (line 544) -- no passive flag specified, but scroll handlers on the element being scrolled don't benefit from passive
- `keydown` on document -- no options specified (defaults to non-passive, but it's a keyboard event) (line 448)
- `resize` on window × 2 (`be` line 483, `ue` line 449) -- no passive flag, but resize events aren't scroll-blocking
- `IntersectionObserver` × 2 (gallery line 366, lightbox line 430)
- No `touchstart`, `touchmove`, `wheel`, or `pointermove` listeners -- zero passive-registration issues because there's nothing to register

**Observers:**
- Gallery IO: root = scroll container, threshold = 0.5 (desktop) / 0.2 (mobile), rootMargin = "0px" (lines 373-375)
- Lightbox IO: root = lightbox scroll container, threshold = 0.5, rootMargin = "0px" (lines 431-434)
- Both observe ALL children (not just visible ones) and persist for component lifetime

**Resize handling:** Two resize listeners. `updateBreakpoint` (line 483) runs on every resize with no debouncing -- sets `isDesktop` boolean from `window.innerWidth >= 768`. `handleResize` (line 439) is debounced 150ms, only fires when lightbox is open, calls `scrollLightboxTo(idx, "auto")`.

**Transitions:**
- Lightbox fade: 300ms opacity (line 690)
- Gallery chevrons + mobile buttons: 200ms opacity (lines 514-519)
- Gallery card border/shadow: 200ms `transition-[border-color,box-shadow,background-color]` on each card (line 553)
- Gallery image hover: 200ms opacity (line 568)
- No transforms animated (no FLIP, no scale, no translate transitions)

**Scroll performance:** Both containers use `scroll-smooth` CSS (lines 535, 721) which offloads smooth-scrolling interpolation to the browser's compositor thread. The `scrollbar-width: none` and `::-webkit-scrollbar: hidden` rules eliminate scrollbar paint work.

### 6. Accessibility

**role/aria-modal:** No `role="dialog"` or `aria-modal="true"` on the lightbox. The lightbox is a plain `<div>` (line 694) with no ARIA role.

**Labels:** Close button has `aria-label="Close lightbox"` (line 711). Prev/Next buttons have `aria-label="Previous image"` / `"Next image"` (lines 640, 670, 785, 815). Gallery images have `alt={img.altText || "Product gallery image N+1"}` (lines 566-567). Lightbox images have `alt={img.altText || "Lightbox image N+1"}` (lines 749-750). Scroll chevrons: "Scroll up" / "Scroll down" (lines 530, 611).

**Focus on open:** No focus management. When lightbox opens, focus stays where it was. `nextTick` (line 450) scrolls the lightbox container but does not call `.focus()` on anything. The close button is not auto-focused.

**Focus trap:** None. Tab key cycles through page elements behind the lightbox. No `tabindex="-1"` on background content, no `aria-hidden` on the rest of the page.

**Focus restore:** No focus tracking on open. After close, focus lands wherever it was when the lightbox was triggered (standard browser behavior since the triggering button still exists in DOM), but this is accidental, not implemented.

**Alt text:** Images use `img.altText` from the Shopify product data. Falls back to `"Product gallery image N+1"` or `"Lightbox image N+1"`. Alt text is not empty/null for any image.

**Live region:** None. No `aria-live` or `role="status"` for announcing slide changes.

**Reduced motion:** No `prefers-reduced-motion` media query check. `scroll-smooth` and all transitions run regardless of user preference.

**Button types:** Gallery items are `<button type="button">` (line 550). Lightbox close and nav are `<button>` without explicit `type` (lines 704, 779, 809) -- they default to `type="submit"` which is harmless (no form) but incorrect. Gallery images are inside buttons but not marked as decorative with `alt=""` (appropriate since they convey product information).

**Tab order:** Gallery items (buttons containing images) are in tab order. Within lightbox, close button → slide content (not focusable) → prev/next buttons.

### 7. Scroll Lock

**Mechanism:** `document.body.style.overflow = "hidden"` on open (line 382), `document.body.style.removeProperty("overflow")` in `requestAnimationFrame` on close (lines 387-389).

**Scrollbar shift:** No compensation for scrollbar width change (no `padding-right` adjustment, no `scrollbar-gutter: stable` CSS). When body `overflow: hidden` removes the scrollbar, the page content shifts right by the scrollbar width (~15-17px on Windows, 0 on macOS with overlay scrollbars).

**Overscroll:** Lightbox container uses `overscroll-x-contain` (line 721), preventing pull-to-refresh / overscroll bounce from closing the lightbox on mobile.

### 8. Lifecycle

**onMounted** (line 480):
- `updateBreakpoint()` -- sets initial `isDesktop`
- `window.addEventListener("resize", updateBreakpoint)` -- no debounce
- `nextTick → updateScrollState(), setupGalleryObserver(), scrollToActive("auto")`

**onUnmounted** (line 488):
- `removeEventListener("resize", updateBreakpoint)`
- `galleryObserver?.disconnect()`
- `lightboxObserver?.disconnect()`
- `removeEventListener("keydown", handleKeydown)`
- `removeEventListener("resize", handleResize)`
- Clear resize timer
- Restore body overflow if lightbox was open

**Cleanup on route change:** Relies on `onUnmounted` -- Nuxt 3 destroys the component on route navigation, so `onUnmounted` fires. All observers and listeners are disconnected. Body overflow is restored.

**Observer recreation:** Gallery observer is recreated on every `[isDesktop, imageCount]` change (line 466) and on mount. Lightbox observer is recreated on every lightbox open (line 452, in `Ve()`) and disconnected on close (line 456).

### 9. Mobile

**touch-action classes:**
- Gallery container: `touch-pan-x touch-pan-y` (line 535) -- allows both pan directions
- Lightbox container: `touch-pan-x` only (line 720) -- allows horizontal pan, vertical pan may trigger page scroll

**Swipe-to-close:** Not implemented. No vertical-swipe detection, no `transform` on the lightbox overlay. The only close mechanism via touch is tapping the backdrop or the × button.

**Safe area:** No `env(safe-area-inset-*)` padding anywhere in the component. The close button at `right-4 top-4` / `md:right-6 md:top-6` may be under the iPhone notch/island.

**Horizontal snap behavior:**
- Mobile gallery: `snap-x snap-mandatory` (line 535), with `max-md:snap-start max-md:snap-always` on children (line 554) -- each child is a mandatory snap point
- Mobile layout: gallery images are `w-full` (full viewport width), `snap-center` -- one image per viewport, horizontal scroll
- `[-webkit-overflow-scrolling:touch]` on both containers (lines 535, 721) enables momentum scrolling on iOS

### 10. Bugs and Risks (ranked by user impact)

---

**#1 CRITICAL -- Lightbox resize race condition** (lines 448-455)

`watch(lightboxOpen, ...)` calls `nextTick(() => { scrollLightboxTo(_, "auto"); setupLightboxObserver(); })` (line 450-453). The `resize` handler `ue` (line 439) fires on window resize with a 150ms debounce, calling `scrollLightboxTo(_, "auto")`. If a browser resize event fires between the watch triggering and `nextTick` executing (window of ~1 frame, or on mobile where viewport changes on scroll), the debounced resize fires first and calls `scrollLightboxTo` with the OLD `_` value. The `nextTick` then fires and scrolls to the correct image, but the resize handler already moved the scroll position. Net result: the lightbox lands on the wrong image, and the user must manually swipe.

**Fix:** In `handleResize`, store the resize handler's timer ID AND skip `scrollLightboxTo` if the lightbox just opened (set a flag in the open handler, clear it after `nextTick` completes).

**Trigger:** Any resize within ~150ms of opening (common on mobile where keyboard or address bar changes viewport height).

---

**#2 HIGH -- Gallery IntersectionObserver ignores `intersectionRatio`** (lines 366-376)

`setupGalleryObserver` callback (line 368): `entries.forEach((entry) => { if (!entry.isIntersecting ...) return; ... })`. The check is `entry.isIntersecting` (boolean), NOT `entry.intersectionRatio`. The lightbox observer (`Re`, line 418) correctly checks `intersectionRatio < 0.5`. The gallery observer sets `C` (active index) whenever ANY part of a slide intersects, not just when it crosses the threshold. With threshold 0.5 on desktop and 0.2 on mobile, the observer can fire for multiple slides simultaneously during scrolling (as one slides out and another slides in, both may have `isIntersecting === true`). The LAST entry processed wins, setting `C` to whichever slide the observer reports last -- non-deterministic.

**Fix:** Add `entry.intersectionRatio >= threshold` check, matching the `Re` lightbox callback pattern.

**Trigger:** iOS Safari particularly affected; scrolling through gallery on desktop with scroll-snap can trigger rapid IO callbacks with stale indices.

---

**#3 MEDIUM -- No body scrollbar-width compensation** (line 382-389)

`document.body.style.overflow = "hidden"` removes the scrollbar, causing a layout shift of ~15-17px on Windows/Linux (non-overlay scrollbar browsers). On close, `removeProperty("overflow")` restores it, causing another shift.

**Fix:** Before hiding, read `window.innerWidth - document.documentElement.clientWidth`, set `body.style.paddingRight` to that value. Restore on close. Or use `scrollbar-gutter: stable` on `<html>`.

---

**#4 MEDIUM -- No lightbox navigation at boundaries** (lines 392-397, 411-416)

Lightbox Prev/Next are conditional (`lightboxIndex > 0` / `< count - 1`) and not rendered at boundaries. Keyboard ArrowLeft/ArrowRight call `lightboxPrev`/`lightboxNext` which ALSO guard with `<= 0` / `>= imageCount - 1`. At the first image, ArrowLeft does nothing. At the last image, ArrowRight does nothing. There's no visual feedback that the user is at an end.

The mobile gallery wraps (ce/Qe), but the lightbox does not. This is inconsistent UX: gallery navigation wraps, lightbox navigation dead-ends.

**Fix:** Either wrap lightbox navigation (like mobile gallery), or keep buttons always visible but disabled at boundaries with `aria-disabled="true"`.

---

**#5 MEDIUM -- No focus management in lightbox** (line 450-453)

When lightbox opens, focus stays on whatever element triggered it. Tab key cycles through invisible background elements. Screen readers are not informed of the lightbox's existence (`role="dialog"`, `aria-modal` missing). User can tab into the browser chrome and back into a gallery button behind the overlay.

**Fix:** On open: save `document.activeElement`, set focus to the close button. Add `role="dialog"` and `aria-modal="true"` to the lightbox div. On close: restore focus to saved element.

---

**#6 LOW -- Stale lightbox index after variant/color change** (lines 458-464)

`watch(imageCount, ...)` clamps `lightboxIndex` to `Math.min(lightboxIndex.value, count - 1)` (line 464) but does NOT reposition the lightbox scroll position. If the user opens the lightbox, a parent component changes the variant/color (triggering `watch([activeImageIndex, images, scrollContainerRef], ...)` on line 471), the gallery scrolls to the new active image, but the lightbox position is not explicitly re-synced. The `Le()` function (line 342) does call `ee()` (scrollLightboxTo) only when `lightboxOpen.value` is true (line 345), so this DOES work IF the lightbox is open during the variant change. But if the lightbox was opened, then closed, then the variant changes, and then the lightbox is re-opened, `lightboxIndex` may still point to a stale index.

`openLightbox(index)` (line 379) receives the clicked image's index directly. So the lightbox always opens on the gallery item that was tapped. The stale-index issue would only manifest if `lightboxIndex` is used elsewhere (it's only set by IO and Prev/Next during the lightbox session), and `scrollLightboxTo` clamps. The real risk is a race where IO fires with a stale entry during a variant change and `watch(imageCount)` hasn't clamped yet (single-frame window).

**Fix (belt-and-suspenders):** Reset `lightboxIndex` to `activeImageIndex.value` in `openLightbox()` or sync it when `watch([activeImageIndex, ...])` fires.

---

**#7 LOW -- No `type="button"` on lightbox controls** (lines 704, 779, 809)

Lightbox close button and prev/next buttons are `<button>` without explicit `type="button"`. In a non-form context this has no effect, but it's a spec violation.

**Fix:** Add `type="button"` to all lightbox buttons.

---

**#8 LOW -- `prefers-reduced-motion` not respected** (global)

`scroll-smooth` CSS and all `transition-*` classes run regardless of user's motion preference. No `@media (prefers-reduced-motion: reduce)` override.

**Fix:** Add `motion-safe:` prefix to all transition classes and `scroll-smooth`.

---

**#9 LOW -- No image error handling** (lines 565-577, 747-754)

No `onError` handler on either gallery or lightbox images. A broken Shopify CDN URL renders a broken image icon with no fallback.

**Fix:** Add `onError` handler that sets a fallback `src` or shows a placeholder.

---

**#10 INFO -- `onScroll` fires on every frame during mobile scrolling** (line 544)

`$e` checks `isDesktop.value` (line 300) and returns early on mobile, so this is a no-op on mobile. On desktop, `q()` reads `scrollTop/scrollHeight/clientHeight` and sets three refs. This is cheap and not a perf concern.

---

## Summary

**Top issues:**
1. **Resize race on lightbox open** (CRITICAL) -- window resize within ~150ms of opening lands on wrong image, affects mobile especially
2. **Gallery IO uses `isIntersecting` instead of `intersectionRatio`** (HIGH) -- broken threshold, multiple slides can claim "active" simultaneously
3. **No scrollbar-width compensation** (MEDIUM) -- layout shift on lightbox open/close on Windows/Linux
4. **Lightbox navigation dead-ends at boundaries** (MEDIUM) -- inconsistent with gallery wrap behavior, no feedback
5. **No focus management in lightbox** (MEDIUM) -- tab leaks behind overlay, no ARIA for screen readers

**What it does well:**
- Clean scroll-snap architecture with no carousel library bloat
- Proper Shopify CDN `srcset`/`sizes` for both gallery and lightbox
- First image prioritized (`fetchpriority="high"`, `eager`), rest lazy-loaded
- IntersectionObserver-based active slide tracking (conceptually correct, one implementation bug)
- Complete observer/listener cleanup in `onUnmounted`
- Proper `overscroll-x-contain` on lightbox for mobile
- keyboard navigation (Escape/ArrowLeft/ArrowRight)
- Mobile gallery wraps, providing continuous navigation
- rAF-deferred body overflow restore (avoids scrollbar flash)
- `touch-action` classes preserve native scrolling and pinch-zoom