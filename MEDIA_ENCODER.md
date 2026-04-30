# Media Encoder Routing — Design Doc

| | |
|---|---|
| Status | v0.1.0 implemented; integration smoke-tested |
| Branch | `feat/media-encoder` |
| Sibling repo | `~/astro-image-hq` (to be created) |
| Approach | DDD bounded contexts + TDD per module |
| Phase 1 deliverable | `astro-image-hq@0.1.0` on npm + revista-3 consuming it |

> **Temp doc.** Lives on `feat/media-encoder` branch only. Delete on merge to `main` after the work is complete.

---

## Problem

AVIF outputs from `astro:assets` (sharp prebuilt at q85, 4:2:0) exhibit visible banding in dark photographs. Root causes:

1. **8-bit AVIF**: only 256 luma levels — mathematically insufficient for smooth dark gradients.
2. **`chromaSubsampling: "4:2:0"`** in `astro.config.mjs`: half-resolution color planes smear bright highlights into shadows.
3. **`quality: 85`**: encoder spends bit budget aggressively, quantizing low-amplitude detail away first.
4. **sharp prebuilt binaries lack 10-bit HEIF**: `bitdepth: 10` errors with `Expected 8 for bitdepth when using prebuilt binaries`.

Mitigations already shipped on this branch (commit pending):

- `chromaSubsampling: "4:4:4"` globally
- `effort: 6` (more encoder search time)
- `quality: 90` per-call

That gets ~80% of the way. Remaining 20% (true shadow banding fix) needs 10-bit AVIF, which requires either a custom sharp build or routing AVIF encoding to a different binary.

## Goal

Build a custom Astro image service (`astro-image-hq`) that:

- Routes AVIF encoding to the best available encoder (avifenc / NVENC / sharp fallback).
- Allows per-format profile selection in `astro.config.mjs`.
- Detects content characteristics (shadow-heavy images) and boosts settings automatically.
- Falls back gracefully when system tools missing — template users with no extra setup still build successfully.
- Ships as standalone npm package (reusable across projects).

Non-goals (v1):

- AMD/Intel GPU encoding (NVENC only).
- JPEG XL output (browser support not ready).
- Replacing sharp for non-AVIF formats (sharp wins everywhere else).

---

## Decisions log

Defaults chosen during planning. Open for revision before they harden.

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Package name | `astro-image-hq` | Pending npm namespace check |
| 2 | Runtime | Bun-first, Node-compatible | Use `node:child_process` over `Bun.spawn`; widens audience |
| 3 | Profile syntax | String preset OR inline object | `profile: "photo"` for ergonomics; full object for power users |
| 4 | Missing-encoder policy | `hq` hard-fails, `balanced`/`photo` warn+downgrade, `fast` silent | Prevents silent regressions in production while staying friendly |
| 5 | Doc location | Repo root | revista-3 has no `docs/` directory |
| 6 | Milestone split | Package v0.1.0 first, revista wiring second | Clean handoff; package tested in isolation before integration |
| 7 | GPU detection | NVIDIA `nvidia-smi` only in v1 | Document AMD/Intel as future work |
| 8 | NVENC opt-in | Must be explicit in `encoderPreference` | NVENC AV1 still-image quality < aom at high bitrates |

---

## Architecture (DDD)

Five bounded contexts. Each owns its types, has a clear contract, and is independently testable.

```
┌─────────────────────────────────────────────────────────┐
│                     Service (Astro adapter)             │
│   Composes the others; implements LocalImageService     │
└────────────┬───────────┬───────────┬───────────┬────────┘
             │           │           │           │
       ┌─────▼────┐ ┌────▼────┐ ┌────▼───┐ ┌─────▼─────┐
       │ Detection│ │Analysis │ │Routing │ │ Encoding  │
       │ probe    │ │stats →  │ │(caps,  │ │ strategy  │
       │ environ. │ │charac.  │ │ char,  │ │ pattern   │
       │          │ │         │ │ profile│ │           │
       │          │ │         │ │ →choice│ │           │
       └──────────┘ └─────────┘ └────────┘ └───────────┘
                                                │
                                ┌───────────────┼───────────────┐
                                │               │               │
                          ┌─────▼─────┐  ┌──────▼─────┐  ┌──────▼─────┐
                          │  sharp    │  │  avifenc   │  │   nvenc    │
                          │ (default) │  │ (libavif)  │  │ (ffmpeg)   │
                          └───────────┘  └────────────┘  └────────────┘
```

### Domain entities

```ts
// EncoderId — discriminator for the strategy pattern
type EncoderId = "sharp" | "avifenc" | "nvenc";

// Capabilities — what's available in this build environment
interface Capabilities {
  sharp: { version: string };                    // always present
  avifenc?: { version: string };                 // libavif CLI
  ffmpeg?: { version: string; encoders: string[] };
  nvenc?: { gpuName: string; computeCap: string; supports444p10: boolean };
  gpuBusy?: boolean;                             // memory util > threshold
}

// Characteristics — image content analysis result
interface Characteristics {
  meanLuma: number;        // 0-255, weighted Y from RGB
  stdevLuma: number;       // overall contrast
  isDark: boolean;         // meanLuma < threshold
  hasGradient: boolean;    // stdev > threshold AND not flat
}

// Profile — encoding strategy preset
interface Profile {
  name: string;
  formats: Record<OutputFormat, FormatConfig>;
  contentAware?: ContentAwareRule[];
  onMissingEncoder: "fail" | "warn" | "silent";
}

interface FormatConfig {
  encoderPreference: EncoderId[];  // walked in order
  quality: number;
  depth?: 8 | 10;
  chromaSubsampling?: "4:4:4" | "4:2:2" | "4:2:0";
  effort?: number;
}

interface ContentAwareRule {
  when: (c: Characteristics) => boolean;
  apply: Partial<FormatConfig>;
}

// Routing decision — pure function output
interface RoutingDecision {
  encoder: EncoderId;
  config: FormatConfig;
  reason: string;             // for logging
  contentBoosted: boolean;
}
```

### Module contracts

| Module | Pure? | Side effects | Public API |
|---|---|---|---|
| `detect.ts` | No | Spawns child processes (one-time) | `detectCapabilities(): Promise<Capabilities>` |
| `analyze.ts` | No | Reads input buffer via sharp | `analyzeImage(buf: Uint8Array): Promise<Characteristics>` |
| `route.ts` | **Yes** | None | `decide(caps, char, profile, format): RoutingDecision` |
| `profiles.ts` | **Yes** | None | `BUILTIN_PROFILES`, `mergeProfile()` |
| `encoders/*.ts` | No | Spawns subprocess (per image) | `encode(buf, config): Promise<EncodeResult>` |
| `index.ts` | No | Astro service adapter | `default hqService(opts): ImageServiceConfig` |

Routing is pure → trivially testable. Detection memoized at module level for build duration. Encoding is thin shell over CLI tools, mockable via dependency injection.

---

## Configuration shape

```js
// astro.config.mjs
import hqService from "astro-image-hq";

export default defineConfig({
  image: {
    service: hqService({
      profile: "photo",  // or inline {name, formats, contentAware, onMissingEncoder}

      // Optional overrides on top of profile
      formats: {
        avif: { encoderPreference: ["avifenc", "sharp"] },
      },

      gpu: {
        maxMemoryUtilization: 0.5,  // skip NVENC if GPU >50% used
      },

      log: "summary",  // "off" | "summary" | "verbose"
    }),
  },
});
```

`hqService(opts)` returns `{ entrypoint, config }` matching Astro's `image.service` contract.

---

## Built-in profiles

| Profile | AVIF | JPEG | WebP | Missing-enc | Use case |
|---|---|---|---|---|---|
| `fast` | sharp 8-bit q80 effort 4 4:4:4 | sharp q82 | sharp q82 | silent | Dev iteration, CI smoke |
| `balanced` | avifenc 8-bit q88 4:4:4 → sharp | mozjpeg q88 → sharp | sharp q88 effort 6 | warn | Default |
| `hq` | avifenc 10-bit q92 4:4:4 (no fallback) | mozjpeg q92 | sharp q92 effort 6 | fail | Production |
| `photo` | hq + content-aware shadows boost q→95 | hq | hq | warn | Photography blogs (revista) |

Content-aware rule for `photo`:
```ts
{
  when: (c) => c.isDark && c.hasGradient,
  apply: { quality: 95, encoderPreference: ["avifenc"] },
}
```

---

## Repo & branch strategy

- **`feat/media-encoder`** in revista-3: hosts this doc + later integration commits.
- **`~/astro-image-hq`**: new sibling repo, the actual package.
- During dev: `bun link` from `~/astro-image-hq` → revista-3.
- After v0.1.0: revista-3 consumes from npm; `feat/media-encoder` rebases and lands.

---

## Implementation order (TDD)

Each step: write test → red → implement → green → refactor.

| Step | Module | Test focus |
|---|---|---|
| 1 | scaffold | `bun test` runs, vitest configured |
| 2 | `types.ts` | Compile-only; type-level assertions |
| 3 | `profiles.ts` | Built-in profiles match table; `mergeProfile()` overrides correctly |
| 4 | `detect.ts` | Mock `child_process.exec`; verify capability matrix across 8 environments |
| 5 | `analyze.ts` | Real sharp on fixtures (dark.png, bright.png, gradient.png); assert characteristics in tolerance |
| 6 | `route.ts` | Decision table: each (caps × char × profile) → expected encoder |
| 7 | `encoders/sharp.ts` | Output equivalent to stock sharp service |
| 8 | `encoders/avifenc.ts` | Spawn mock + real CLI integration test (skipped if avifenc missing) |
| 9 | `encoders/nvenc.ts` | Spawn mock + real GPU integration test (skipped if NVENC missing) |
| 10 | `index.ts` | End-to-end: feed image, get AVIF back, verify it decodes |
| 11 | revista-3 wiring | `bun run build` succeeds; output AVIFs visually inspected |

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| avifenc not installed → silent quality regression | `hq` profile fails build hard; `balanced` warns once |
| NVENC AV1 4:4:4 needs Ada/Blackwell (sm_89+) | Detection probes `compute_cap`; auto-disable NVENC on older GPUs |
| Pipe-based avifenc fails on huge images | Threshold: spill to temp file when input > 32MB |
| `sharp.stats()` slow on large remote-fetched images | Resize to 256px thumbnail before stats |
| Profile changes don't invalidate Astro cache | Hash profile name into `propertiesToHash`; document `rm -rf node_modules/.astro/assets` for paranoia |
| ComfyUI/llama-server holding GPU | Probe `nvidia-smi` memory util; fallback to avifenc when busy |
| Bun-only APIs break Node users | Use `node:child_process`, `node:fs/promises` only |
| ffmpeg AVIF muxer immaturity | Test output decodes; pivot to temp file if pipe broken |

---

## Open questions (deferred to implementation)

1. Does `ffmpeg -f avif -` (stdout pipe) produce valid AVIF, or does the muxer need a seekable file? **Test with libavif's `avifdec` early.**
2. Should NVENC encode produce 10-bit on RTX 5090 (sm_120)? Specs say yes; verify experimentally.
3. Does `bun link` survive Astro's content collection cache? May need `bun install --force` between encoder iterations.
4. avifenc version differences (1.0 vs 1.1+ command-line flags) — pin minimum version.

---

## Verification checklist (definition of done for v0.1.0)

- [x] `astro-image-hq` package builds clean with `bun run build`
- [x] `bun test` green: 49/49 (4 unit suites + 1 integration suite)
- [x] revista-3 builds with `profile: "photo"` (sharp fallback, before avifenc install)
- [x] avifenc detected and used post-install (verified via end-to-end smoke test)
- [x] NVENC integration test produces decodable AVIF on RTX 5090
- [x] Shadow boost triggers correctly on dark gradient images
- [x] README in `astro-image-hq` documents config + 4 profiles + caveats
- [ ] `npm publish --dry-run` validation (deferred to publish step)
- [ ] Couch image (original banding case) visibly improved at 1:1 zoom (manual check needed)
- [ ] `bun run lint:site` passes (deferred — full build takes long)
- [ ] CI workflow updated with `apt-get install libavif-bin` (Dockerfile + .github/workflows)
- [ ] CHANGELOG.md entry for v0.1.0

## Findings during implementation

1. **NVENC AV1 reality**: ffmpeg's `av1_nvenc` only outputs 4:2:0 8-bit AVIF
   regardless of GPU silicon. Routing automatically skips NVENC when 4:4:4 or
   10-bit is requested. NVENC is therefore useful only for fast 4:2:0 8-bit
   builds, not for the banding fix this package was built for.

2. **AVIF muxer requires seekable output**: ffmpeg cannot write AVIF to stdout
   pipe. NVENC encoder uses temp file via `node:os.tmpdir()`.

3. **avifenc 1.4 CLI**: uses `-q QUALITY -d DEPTH -y YUV -s SPEED` (not the
   older `--min`/`--max` quantizer flags). Stdin support exists via `--stdin`
   but defaults to y4m format; we use temp PNG files for simplicity.

4. **Build speed**: revista-3 build is fetch-bound (image.erfi.io CDN), not
   encode-bound. GPU acceleration helps marginally for full builds; per-image
   encode time of 200-500ms is dwarfed by CDN fetch latency. Real win is
   visual quality (10-bit shadows), not throughput.

---

## Next steps after v0.1.0

- Phase 2: AMD/Intel GPU detection (VAAPI, ROCm)
- Phase 2: JPEG XL output via ffmpeg+libjxl when browser support stabilizes
- Phase 2: Histogram-based shadow ratio (more accurate than mean+stdev)
- Phase 2: Per-image profile override via frontmatter (`imageProfile: "hq"` per post)
- Phase 3: Upstream PRs to sharp/libvips for native 10-bit support
