# Zoom sharpness measurement (2026-10-30)

Question: does the lightbox's `scale()` zoom render softer than laying the
image out at its zoomed size?

Method: `capture.mjs` (playwright-core, system Chromium at `/usr/sbin/chromium`,
SwiftShader software rendering, 1200x800 viewport, DPR 2) opens
`/long_form/adam/` on a local `astro preview`, wheel-zooms the first image at
its centre (reached 2.01136x), waits for the original `adam_1.jpg` to load,
and screenshots a 300x300 clip. `psnr.py` compares each clip with a Lanczos
render of `https://image.erfi.io/adam_1.jpg` at the same on-screen geometry.
Variants are selected by the `order` array in `capture.mjs`.

| Variant                                                     | Build          | PSNR     | Detail ratio | Runs         |
| ----------------------------------------------------------- | -------------- | -------- | ------------ | ------------ |
| `scale()` transform (with `will-change`)                    | before abb47a0 | 37.18 dB | 0.843        | 2, identical |
| `scale()` transform, `will-change: auto` injected           | before abb47a0 | 37.18 dB | 0.843        | 2, identical |
| relayout by hand (width/height = fit \* zoom, no transform) | before abb47a0 | 50.47 dB | 0.927        | 2, identical |
| committed zoom, unrounded translate                         | abb47a0 draft  | 46.35 dB | 0.862        | 2, identical |
| committed zoom, translate rounded to device px (shipped)    | abb47a0        | 50.39 dB | 0.927        | 2, identical |

Detail ratio = mean absolute gradient of the clip / that of the reference.
Laplacian variance was tried first and rejected: it rose for the relayout
variant but also rewards aliasing, so it cannot separate sharp from noisy.

Limits: Chromium only, software compositing, one image, one zoom level.
Firefox, Safari and GPU raster paths were not measured.
