# Depth-Based Parallax Hero — Research & Findings

Research conducted on the `feat/depth-parallax` branch exploring AI-generated depth maps for 3D parallax effects on hero images. Ultimately abandoned in favour of improving the existing `HeroImage` component.

## Approach

Used `@huggingface/transformers` v3.8.1 to run **Depth Anything V2 Small** (ONNX, q8 quantised) locally at build time via an Astro integration. No API key needed — the model runs entirely in Node/Bun via ONNX Runtime.

- Scanned MDX frontmatter for `image.src` URLs
- Downloaded source images from `image.erfi.io`
- Generated full-resolution grayscale depth maps (3840px+, ~66MB total for 35 images)
- Saved as `public/depth-maps/<sha256-hash>.png` (deterministic, cacheable)
- First run ~77s for 36 images; subsequent builds skip entirely when cached
- GitHub Actions workflow cached both depth maps and the HuggingFace model (~28MB)

## Techniques Tried

### 1. Naive UV Displacement

Shift each pixel's UV coordinates by `mouse_offset * depth * intensity`. Foreground moves more, background stays still.

**Result:** Visible tearing/ghosting at every depth boundary (hair edges, tree branches, ears against walls). When foreground pixels shift, they reveal nothing behind them — the occluded pixels simply don't exist in a single photograph.

### 2. Parallax Occlusion Mapping (Raymarching)

16-step ray march per pixel (based on Depthy/panrafal implementation). Casts a ray through the depth map to find where the view ray intersects the depth surface. Includes confidence-weighted accumulation, sub-step correction, depth compression to [0.1, 0.9], and an enlarge factor to crop border artifacts.

**Result:** Better than naive displacement but still produced severe warping on real photographs with complex depth boundaries. The technique works well for simple geometry (coins, text) but breaks down on organic subjects like portraits and foliage.

### 3. Depth-Weighted Ken Burns Drift

Slow sinusoidal zoom/pan where foreground and background layers move at different rates based on depth. No mouse interaction.

**Result:** At intensities low enough to avoid artifacts, the effect was imperceptible. At visible intensities, the same displacement artifacts appeared (just slower).

### 4. Depth Color Grading

Warm foreground tint, desaturated/cool background. No UV displacement — pure per-pixel colour modification.

**Result:** Hole-free, but visibly altered the photographs' existing colour grading, which is unacceptable on a photography portfolio where images have intentional colour treatment.

### 5. Mouse Wobble at Very Low Intensity

Same as #1 but capped at `intensity = 0.02` (max ~38px shift on 1920w).

**Result:** Still produced visible doubling at sharp depth transitions (e.g., ear against a wall). Even sub-pixel displacement becomes visible when the depth map has a sharp step function.

## Why Single-Image Depth Parallax Doesn't Work for Photography

The fundamental problem: **a single photograph doesn't contain the information needed to show what's behind foreground objects.** Every displacement technique — no matter how sophisticated — eventually needs to reveal pixels that were occluded in the original image. Professional solutions (Depthy, DepthFlow) mitigate this with inpainting, but that means synthesising image content, which is inappropriate for a photography portfolio.

Effects that don't displace pixels (DoF, fog, colour grading, chromatic aberration, vignetting) are hole-free, but they all modify the photograph's appearance. For a photography site where images have intentional artistic treatment, adding synthetic post-processing undermines the work.

## Techniques That Would Work (But Weren't Appropriate Here)

| Effect                         | Hole-Free? | Issue for Photography             |
| ------------------------------ | ---------- | --------------------------------- |
| Depth-of-field / bokeh         | Yes        | Photos already have real lens DoF |
| Depth fog / atmosphere         | Yes        | Alters the image                  |
| Depth colour grading           | Yes        | Fights existing colour treatment  |
| Depth chromatic aberration     | Yes        | Can look like a broken display    |
| Depth-based vignette/spotlight | Yes        | Can look gimmicky                 |

## Key References

- **Depthy** (panrafal/depthy) — Best open-source depth parallax. Uses raymarching, confidence accumulation, sub-step correction. Default scale 0.015, 16 steps.
- **DepthFlow** (BrokenSource/DepthFlow) — Two-pass forward+backward raymarching with surface normal estimation.
- **hover-effect** (robin-dela/hover-effect) — Simple displacement for hover transitions. `intensity: 0.1-0.3` for transitions, much lower for wobble.
- **three.js BokehShader2** — Physically-based depth-of-field with CoC, pentagon bokeh.
- **pmndrs/postprocessing** — DepthOfFieldEffect (DOOM 2016 approach), ChromaticAberrationEffect.

## Technical Details Preserved

These may be useful if revisiting with different source material (e.g., stereo pairs, light field captures, or subjects with simpler depth geometry):

- **Depth Anything V2 Small** q8 ONNX model: ~28MB, runs in ~2s per image at full resolution
- Depth map hash function: first 16 chars of SHA-256 of the source image URL
- WebGL UV origin is bottom-left — vertex shader must flip Y: `1.0 - (y * 0.5 + 0.5)`
- Mouse listeners must be on the container div, not the canvas, when an overlay with `z-10` exists
- For CSS scroll parallax, `translate3d(0, scrollY * 0.3, 0)` with an oversized container (`top: -20%, height: 120%`) is robust and artifact-free
