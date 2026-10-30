"""PSNR of lightbox zoom screenshots against a Lanczos render of the original.

Usage: python3 psnr.py <dir-with-sharp-*.png/json> <original.jpg>
capture.mjs writes sharp-<variant>-<run>.png (300x300 CSS px clip at
(450,250), DPR 2) plus the image rect at capture time as JSON.
"""
import glob, json, sys
import numpy as np
from PIL import Image

src_dir, original = sys.argv[1], sys.argv[2]
orig = Image.open(original).convert("L")
W0, H0 = orig.size
cx, cy, cw, ch, dpr = 450, 250, 300, 300, 2
for f in sorted(glob.glob(f"{src_dir}/sharp-*.png")):
    r = json.load(open(f[:-4] + ".json"))
    box = ((cx - r["x"]) / r["w"] * W0, (cy - r["y"]) / r["h"] * H0,
           (cx + cw - r["x"]) / r["w"] * W0, (cy + ch - r["y"]) / r["h"] * H0)
    ref = np.asarray(orig.resize((cw * dpr, ch * dpr), Image.LANCZOS, box=box), dtype=float)
    got = np.asarray(Image.open(f).convert("L"), dtype=float)
    psnr = 10 * np.log10(255**2 / ((ref - got) ** 2).mean())
    hf = lambda a: np.abs(np.diff(a, axis=0)).mean() + np.abs(np.diff(a, axis=1)).mean()
    print(f"{f.rsplit('sharp-', 1)[1][:-4]:18s} PSNR {psnr:5.2f} dB  detail ratio {hf(got) / hf(ref):.3f}")
