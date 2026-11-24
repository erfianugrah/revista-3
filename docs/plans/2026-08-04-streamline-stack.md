# Streamline Stack Implementation Plan

> **For agentic workers:** this plan is designed to be executed by the
> self-correcting loop (`.pi/harness.json`). Per-workstream harness manifests are
> in section 10. Steps use checkbox (`- [ ]`) syntax for tracking. When run under
> the loop, do NOT commit per task - the loop owns git state. When run by a human
> or via `executing-plans`, commit at the end of each task.

**Goal:** Remove React entirely, collapse 28 near-duplicate route files into a
config-driven set, migrate Tailwind v4 out of v3 compatibility mode, and fix a
confirmed reading-time inconsistency - with zero change to rendered output or
generated URLs.

**Architecture:** The site stays Astro 7 SSG with MDX content collections. The
four React islands become Astro components with inline scripts or pure CSS. The
per-collection route files become one `COLLECTIONS` config array driving
parameterised `[collection]/` routes. Tailwind config moves from
`tailwind.config.mjs` into `@theme` blocks in `global.css`.

**Tech Stack:** Astro 7.1.5, Bun, Tailwind CSS 4.2.2, @tailwindcss/typography
0.5.19, MDX, Pagefind, Playwright, deployed to Cloudflare Workers + GitHub Pages.

**Branch:** `refactor/streamline-stack`

---

## 1. Status tracker

| ID  | Workstream                        | Status                                       | Gate                           |
| --- | --------------------------------- | -------------------------------------------- | ------------------------------ |
| W0  | Test hardening + baseline capture | [x] done (`8c2fb56`)                         | 8 sensors green                |
| W1  | Route collapse + reading-time fix | [x] done (`41ac82c`)                         | URL parity 83/83               |
| W2  | React removal                     | [x] done (`64fdd44`)                         | 14 sensors green, 0 `.tsx`     |
| W3  | Tailwind v4 native config         | [x] done (`bf3b23b`)                         | 6/6 canaries, in-session judge |
| W4  | HeroImage / parallax decision     | [x] done - folded into W2 (vanilla parallax) | -                              |
| W5  | Docs sweep                        | [x] done (`6bce71b`)                         | 6 sensors green                |

Post-W2 user-review fixes in `2db4010` (sun-rays inline-style bug, transparent
ScrollToTop restored, favicon placeholder alpha). Final state: 262,990 -> 35,379
bytes of JS, 32 -> 22 runtime deps, 28 -> 8 route files, 83/83 URL parity, 86
passed + 1 skipped in the Playwright suite.

Execution order is W0 -> W1 -> W2 -> W3 -> W5, with W4 slotted into W2 once the
user decides. W0 is not optional: sections 3.4 and 9 explain why the current
suite cannot detect the failures W2 can cause.

---

## 2. Baseline facts (all verified in-session, 2026-08-04)

Measured on branch `refactor/streamline-stack` at `def6646`, against the
existing `dist/` (built 2026-07-29 16:58, newer than every tracked `src` file,
so it reflects current source).

### 2.1 Output size

```
76        HTML pages in dist/
112M      dist/ total (images dominate)
262,990   bytes of JS in dist/_astro (excluding pagefind)
```

JS breakdown, exact bytes:

| Bytes       | File                                            | Fate                                                 |
| ----------- | ----------------------------------------------- | ---------------------------------------------------- |
| 184,122     | `client.1UJ0AL-u.js`                            | React DOM runtime - W2 deletes                       |
| 32,150      | `ScrollToTop.js`                                | island + lucide + cva + radix + twMerge - W2 deletes |
| 8,036       | `react.js`                                      | Astro React renderer - W2 deletes                    |
| 2,674       | `HeroImage.js`                                  | W2/W4 deletes                                        |
| 1,976       | `Hamburger.js`                                  | W2 deletes                                           |
| 1,632       | `ThemeToggle.js`                                | W2 deletes                                           |
| 471         | `jsx-runtime` + `page.js`                       | W2 deletes                                           |
| **231,061** | **removable subtotal (88% of all JS)**          |                                                      |
| 13,607      | `ClientRouter`                                  | stays (unless separately dropped)                    |
| 7,295       | Masonry/lightbox                                | stays                                                |
| 3,468       | Pagefind glue                                   | stays                                                |
| 2,828       | prefetch                                        | stays                                                |
| 4,731       | 404, NextPost, theme, randomImage, Footer, misc | stays                                                |
| **31,929**  | **remaining after W2**                          |                                                      |

Post-W2 target is **~32KB**, not the ~10-15KB quoted earlier in discussion.
Dropping `ClientRouter` + `prefetch` as a separate decision would reach ~15KB.

### 2.2 Content and routes

```
60 MDX files: muses 40, long_form 12, short_form 4, zeitweilig 1, authors 1, cv 1
28 route files in src/pages/ (+ _README.md, not a route)
 0 draft files (underscore-prefixed)
```

`long_form`'s 12 posts live in a nested `src/content/long_form/gleichgesinnte/`
directory, all named `2018-12-25-<name>.mdx`.

### 2.3 Dependencies

`32` runtime dependencies, `12` devDependencies. W2 removes 10 runtime deps:
`@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom`,
`lucide-react`, `class-variance-authority`, `@radix-ui/react-slot`,
`tailwind-merge`, `clsx`. Result: 22 runtime deps.

---

## 3. Bugs found during review (fix as part of this work)

### 3.1 Reading time disagrees between list and detail pages - CONFIRMED

Two different computations coexist.

**Path A (detail pages, 4 files):** `astro.config.mjs:67` registers
`remarkReadingTime` from `src/scripts/remark-reading-time.mjs`, which runs
`getReadingTime(toString(tree))` over the parsed mdast - prose text only. It
writes `frontmatter.minutesRead` and `frontmatter.readingTimeMs`. Consumed at
`src/pages/{muses,short_form,long_form,zeitweilig}/[...id].astro:22` as
`formatReadingTime(remarkPluginFrontmatter.readingTimeMs)`.

**Path B (list + tag pages, 8 files):** `getReadingTime(post.body)` on the RAW
MDX source, which counts `import` statements, JSX component calls, and the giant
image-URL arrays in `<Masonry images={[...]}/>` as prose. Call sites:
`src/pages/{muses,short_form,long_form,zeitweilig}.astro:7,26` and
`src/pages/{muses,short_form,long_form,zeitweilig}/tags/[tag].astro:8,33`.

Measured divergence on every `long_form` post:

| post   | list page | detail page | delta |
| ------ | --------- | ----------- | ----- |
| adam   | 27s 300ms | 17s 100ms   | +60%  |
| anam   | 34s 500ms | 20s 100ms   | +72%  |
| angelo | 30s 600ms | 20s 400ms   | +50%  |
| ej     | 48s 0ms   | 37s 500ms   | +28%  |

Two further inconsistencies in the same area:

- `remark-reading-time.mjs` computes `minutesRead` (the human string `"3 min
read"`) and nothing ever reads it. Pages re-format the raw ms instead.
- `authors` passes no reading time at all, on either list or detail.
- `formatReadingTime()` (`src/scripts/utils.ts:17-27`) renders millisecond
  precision (`"3m 12s 480ms"`), and `BlogPost.astro:13,25,74-77` names the prop
  `minutesRead` while receiving that string.

**Decision update (post-implementation, user call):** the absurd precision is
intentional site design. The display was briefly changed to the plugin's
`minutesRead` ("1 min read") and reverted; the final format is second-level
precision (`"1m 23s"`, `"17s"`) for reading times and `HH:MM:SS` for dates,
with milliseconds dropped. The single-source-of-truth consistency fix
above stands unchanged.

**Fix:** single source of truth = the remark plugin's `readingTimeMs`. See W1
Task 4 for how list pages get it without an N-times `render()` cost.

### 3.2 ScrollToTop renders an unstyled button - CONFIRMED, then REVERSED

`ScrollToTop.tsx:39-45` styles the button with `bg-primary`,
`text-primary-foreground`, `focus:ring-primary`. Those are shadcn theme tokens.
Grepping the built CSS for each:

```
.bg-primary{               0 occurrences
.text-primary-foreground{  0 occurrences
.ring-primary{             0 occurrences
.border-input{             0 occurrences
.bg-background{            0 occurrences
```

And `--color-primary` is defined nowhere in `src/styles/` or
`tailwind.config.mjs`. The tokens never resolve.

**CORRECTION (post-W2, user review):** the transparent floating-chevron look
this produces IS the intended design, not a bug. The original analysis above
correctly identified that the tokens resolve to nothing but incorrectly
concluded the button needed real colours. W2 initially painted it a solid
circle per that wrong spec; the user sent it back ("needs to be transparent")
and the replacement now uses `background-color: transparent; color: inherit;`
with a transparent-background test locking the design in.

### 3.2b Favicon placeholder loses alpha - found in user review

`NextPost.astro` falls back to an optimized favicon for posts without an
`image`. The 360x360 request (>=64px, even) routes through astro-image-hq's
SVT-AV1 4:2:0 path, which drops the alpha plane: the transparent logo becomes a
solid black square (verified: 0/129600 transparent pixels in the built asset).
The 60x60 variant keeps alpha because sub-64px inputs fall back off the SVT
path. Pre-existing on the live site (identical asset hash), not introduced by
this branch. Fixed by requesting `format: "png"` for the favicon (sharp path
preserves alpha). **Fixed upstream in astro-image-hq 0.1.5: alpha-bearing images now route off SVT/NVENC to aom to preserve transparency.**

### 3.3 Dead Tailwind config - CONFIRMED

`tailwind.config.mjs:13-22` defines `objectPosition` (`top-33`, `top-50`),
`backgroundPosition` (`center-33`), `backgroundSize` (`size-66`). All four are:

- **unreadable by v4** - the strings `objectPosition`, `backgroundPosition`,
  `backgroundSize` do not appear anywhere in the tailwindcss 4.2.2 runtime
  bundle, while `fontFamily` and `screens` do (positive control).
- **unused** - 0 usages of `object-top-33`, `object-top-50`, `bg-center-33`,
  `bg-size-66` anywhere in `src/`.
- **absent from output** - none of those four class names appear in the built
  CSS.

`2xl` (3800px) likewise has 0 real usages and emits no `@media` block. Delete
rather than migrate.

### 3.4 `sync-readme-versions.js` will write a broken badge

`scripts/sync-readme-versions.js:22-24` uses `clean(raw)` =
`raw?.replace(...) ?? "unknown"`. With `react` removed from `package.json`,
`v.react` becomes the string `"unknown"`, and the rule at `:43` rewrites
`README.md:5` to a `React-unknown-61DAFB` badge on the very next `bun run build`
(`prebuild` fires automatically). It does not throw - it silently ships.

**Must be fixed in the same commit that drops `react`.**

Separately, the MDX badge rule at `:47`
(`/MDX-[\d.]+(?:-[a-z.]+)?-1B1F24/g`) does not match the current badge text
`MDX-5.0.0-beta.12-1B1F24`, so `README.md:7` has been silently stale while
`package.json` pins `@astrojs/mdx` 7.0.5.

### 3.5 `ProseCv.astro` references non-existent CSS variables

`src/components/ProseCv.astro:82,95,107,119,131` use `var(--text-6)`,
`var(--text-5)`, `var(--text-4-5)`, `var(--text-4)`. Tailwind v4 defines
`--text-xs/sm/base/lg/xl/2xl/3xl/4xl` (`node_modules/tailwindcss/theme.css`).
These five declarations resolve to nothing. The inline comments reveal intent
(`/* text-2xl in v4 */`). **Fix separately from W3** so a CV regression is not
misattributed to the Tailwind migration.

---

## 4. Empirically settled: the Tailwind typography layering question

`src/styles/global.css:3-11` carries a 9-line comment asserting that the
typography plugin must be loaded via `require()` because the ESM path "emits
`.prose` rules as unlayered CSS, which always beats `@layer utilities`". AGENTS.md
repeats this as load-bearing. This gated the whole W3 decision, so it was tested
rather than assumed.

**Method:** prettify the built stylesheet and inspect the actual layer structure.

```bash
bun x prettier --parser css dist/_astro/BaseLayout.DBdJ92n4.css > /tmp/pretty.css
```

**Findings (verified):**

1. The bundle's layer structure is
   `@layer properties` -> `@layer theme` -> `@layer base` -> `@layer components;`
   (bodiless declaration, never given a body) -> `@layer utilities { ... }` ->
   unlayered tail from `global.css:43-61`.
2. `.prose` rules sit **inside `@layer utilities`**. Not unlayered, not in
   `components`.
3. `.max-w-7xl{max-width:var(--container-7xl)}` is emitted **after** the
   `.prose` block within the same layer, so it wins by source order. This is
   exactly the mechanism `Prose.astro:8` (`px-24 max-sm:px-5 max-w-7xl`) relies
   on, and it is working in the shipped bundle.
4. Custom breakpoints emit correctly as `@media (width>=800px)`,
   `(width>=1200px)`, `(width>=1900px)`, `(width>=2500px)`. No 3800px block
   exists, confirming `2xl` is dead.
5. `darkMode: "class"` compiles to the `:is(.dark *)` variant form.

**Supporting code evidence:** `.prose` enters CSS only via `addComponents`
(`node_modules/@tailwindcss/typography/src/index.js:118`), and in tailwindcss
4.2.2 `addComponents()` delegates directly to `this.addUtilities()`. `@plugin`
and `@config` are parsed by the same handler in the same chunk and both resolve
through the same `buildPluginApi`.

**Conclusion:** the `@plugin` vs `@config` layering risk the comment warns about
does not exist in tailwindcss 4.2.2. W3 is LOW risk. The comment describes a real
historical symptom with a misattributed cause; delete it only after the
`max-width` canary (W0 Task 2) proves green post-migration.

**Residual unknown:** v3 `theme.screens` (non-`extend`) _replaced_ the default
breakpoints; v4 `@theme` _merges_. If the migration does not clear defaults, v4's
`--breakpoint-sm: 40rem` could co-exist with the custom 800px. The W0 breakpoint
canary is specifically designed to catch this. This is the one thing in W3 that
can actually bite.

---

## 5. W0 - Test hardening and baseline capture

**Why this is first:** the suite cannot currently distinguish "the replacement
works" from "the replacement renders nothing".

- `tests/theme.spec.ts:9-11` wraps its body in
  `if (await toggle.isVisible(...).catch(() => false))`. The comment says "Theme
  toggle may be rendered by React island with client:idle". If W2's replacement
  renders nothing, the body is skipped and the spec reports **green**. No test
  asserts the toggle exists.
- `tests/navigation.spec.ts:21` and `:35` have the same `if (await
hamburger.isVisible())` guard.
- `tests/lightbox.spec.ts` - all 5 tests call `test.skip()` when the gallery link
  is absent.
- `ScrollToTop` has **zero** tests. No spec mentions scroll or back-to-top.
- `HeroImage` parallax has **zero** tests.
- Reading time has **zero** tests.
- No `toHaveCSS` assertion exists anywhere in the suite.

**Files:**

- Modify: `tests/theme.spec.ts`, `tests/navigation.spec.ts`
- Create: `tests/islands.spec.ts`, `tests/styling.spec.ts`, `tests/reading-time.spec.ts`
- Create: `scripts/capture-routes.sh`

### Task W0.1: Capture the route + output baseline

- [ ] **Step 1: Build on a clean `main` checkout**

```bash
git stash -u && git checkout main && bun run build
```

Expected: build succeeds. Warm `node_modules/.astro/assets` (106M present) means
this takes seconds, not the 5-8 min cold path.

- [ ] **Step 2: Write the capture script**

Create `scripts/capture-routes.sh`:

```bash
#!/usr/bin/env bash
# Capture the emitted route + asset manifest for before/after parity checks.
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:?usage: capture-routes.sh <output-file>}"
{
  shopt -s globstar nullglob
  for f in dist/**/*.html; do echo "${f#dist}"; done
  for f in dist/**/*.xml; do echo "${f#dist}"; done
} | LC_ALL=C sort > "$out"
echo "captured $(wc -l < "$out") routes -> $out"
```

- [ ] **Step 3: Capture and verify the count**

```bash
chmod +x scripts/capture-routes.sh
./scripts/capture-routes.sh /tmp/routes-baseline.txt
```

Expected: `captured 76 routes` plus the sitemap/RSS XML entries. Record the exact
number here once run: `______`.

- [ ] **Step 4: Capture the CSS and JS baseline**

```bash
cp dist/_astro/BaseLayout.*.css /tmp/css-baseline.css
( shopt -s globstar; stat -c '%s %n' dist/**/*.js | grep -v pagefind | sort -rn ) \
  > /tmp/js-baseline.txt
```

- [ ] **Step 5: Return to the branch**

```bash
git checkout refactor/streamline-stack && git stash pop
```

### Task W0.2: Add the CSS canary tests

These must be written and pass **on `main`** before W3 runs, otherwise they prove
nothing.

**Files:** Create `tests/styling.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from "@playwright/test";

// These canaries gate the Tailwind v4 config migration (W3).
// They must pass BEFORE the migration and AFTER it.

test("prose max-width is overridden by max-w-7xl, not prose 65ch", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/long_form/adam/");
  // .prose sits in @layer utilities; .max-w-7xl is emitted after it and wins
  // by source order. If the typography plugin ever lands unlayered, this flips
  // to a ch-derived value.
  await expect(page.locator(".prose").first()).toHaveCSS("max-width", "1280px");
});

test("custom sm breakpoint is 800px, not Tailwind default 640px", async ({
  page,
}) => {
  await page.goto("/");
  const probe = page.locator("body");
  // Below the custom breakpoint: sm: utilities must NOT apply.
  await page.setViewportSize({ width: 799, height: 900 });
  const below = await probe.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue(
      "--breakpoint-sm",
    ),
  );
  // Above it: they must apply.
  await page.setViewportSize({ width: 801, height: 900 });
  // Assert via a real sm:-gated element rather than the variable alone.
  const smEl = page.locator(".sm\\:grid").first();
  if ((await smEl.count()) > 0) {
    await expect(smEl).toHaveCSS("display", "grid");
    await page.setViewportSize({ width: 799, height: 900 });
    await expect(smEl).not.toHaveCSS("display", "grid");
  } else {
    throw new Error("no .sm:grid element found to probe the breakpoint");
  }
  expect(below).toBeDefined();
});

test("font-overpass-mono resolves to Overpass Mono", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".font-overpass-mono").first()).toHaveCSS(
    "font-family",
    /Overpass Mono/,
  );
});

test("font-inconsolata resolves to Inconsolata", async ({ page }) => {
  await page.goto("/long_form/adam/");
  await expect(page.locator(".font-inconsolata").first()).toHaveCSS(
    "font-family",
    /Inconsolata/,
  );
});

test("prose-no-quotes suppresses blockquote smart quotes", async ({ page }) => {
  await page.goto("/long_form/adam/");
  const bq = page.locator(".prose blockquote p").first();
  if ((await bq.count()) === 0) test.skip(true, "no blockquote on this post");
  const before = await bq.evaluate(
    (el) => getComputedStyle(el, "::before").content,
  );
  expect(before).toBe("none");
});

test("dark variant applies via .dark class", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  const bg = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  // html.dark sets background-color:#222125
  expect(bg).toBe("rgb(34, 33, 37)");
});
```

- [ ] **Step 2: Run against `main` and confirm all pass**

```bash
git stash -u && git checkout main && bun run build
bunx playwright test tests/styling.spec.ts
git checkout refactor/streamline-stack && git stash pop
```

Expected: 6 passed. If the `prose max-width` test does not return `1280px`,
STOP - the section 4 conclusion is wrong and W3 must be re-planned.

### Task W0.3: Convert conditional island tests to hard assertions

**Files:** Modify `tests/theme.spec.ts:4-23`, `tests/navigation.spec.ts:13-41`

- [ ] **Step 1: Replace the theme guard**

In `tests/theme.spec.ts`, replace the `if (await toggle.isVisible(...))` guard
with an unconditional assertion:

```ts
test("theme toggle exists and is clickable", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", {
    name: /switch to (light|dark) theme/i,
  });
  await expect(toggle).toBeVisible();
  const before = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  );
  await toggle.click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.classList.contains("dark")),
    )
    .toBe(!before);
});
```

- [ ] **Step 2: Replace the hamburger guard**

In `tests/navigation.spec.ts`, drop the `if (await hamburger.isVisible())` wrapper
so the test fails when the element is missing:

```ts
test("hamburger menu toggles on mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const hamburger = page.getByRole("button", { name: /open menu|close menu/i });
  await expect(hamburger).toBeVisible();
  await expect(hamburger).toHaveAttribute("aria-expanded", "false");
  await expect(hamburger).toHaveAttribute("aria-controls", "nav-links");
  await hamburger.click();
  await expect(hamburger).toHaveAttribute("aria-expanded", "true");
  const navLinks = page.locator("#nav-links");
  await expect(navLinks).toHaveClass(/open/);
  await expect(navLinks).not.toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(hamburger).toHaveAttribute("aria-expanded", "false");
  await expect(navLinks).toHaveClass(/collapsed/);
});
```

- [ ] **Step 3: Run against `main`**

```bash
bunx playwright test tests/theme.spec.ts tests/navigation.spec.ts
```

Expected: all pass. If the hamburger `inert`/`open`/`collapsed` assertions fail
on `main`, adjust them to match observed behaviour - they are the W2 acceptance
criteria and must describe reality, not aspiration.

### Task W0.4: Add ScrollToTop and reading-time specs

**Files:** Create `tests/islands.spec.ts`, `tests/reading-time.spec.ts`

- [ ] **Step 1: ScrollToTop spec**

```ts
import { test, expect } from "@playwright/test";

test("scroll-to-top button appears past 300px and returns to top", async ({
  page,
}) => {
  await page.goto("/long_form/adam/");
  const btn = page.getByRole("button", { name: /scroll to top/i });
  await expect(btn).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(btn).toBeVisible();
  await btn.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
});

test("scroll-to-top button has a visible background", async ({ page }) => {
  // Regression guard for the undefined bg-primary token (plan section 3.2).
  await page.goto("/long_form/adam/");
  await page.evaluate(() => window.scrollTo(0, 800));
  const btn = page.getByRole("button", { name: /scroll to top/i });
  await expect(btn).toBeVisible();
  const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(bg).not.toBe("transparent");
});
```

Note: the second test is expected to **FAIL on `main`** - that is the point, it
documents bug 3.2. Mark it `test.fail()` on `main` and flip it to a normal test
in W2.

- [ ] **Step 2: Reading-time consistency spec**

```ts
import { test, expect } from "@playwright/test";

const RT = /(?:\d+m )?\d+s \d+ms/;

test("reading time on the list card matches the detail page", async ({
  page,
}) => {
  await page.goto("/long_form/");
  const card = page.locator('a[href="/long_form/adam/"]').first();
  await expect(card).toBeVisible();
  const listText = await card.evaluate((el) => {
    const root = el.closest("article") ?? el.parentElement;
    return root?.textContent ?? "";
  });
  const listRt = listText.match(RT)?.[0];
  expect(listRt, "no reading time found on the list card").toBeTruthy();

  await page.goto("/long_form/adam/");
  const detailRt = (await page.locator("body").textContent())?.match(RT)?.[0];
  expect(detailRt, "no reading time found on the detail page").toBeTruthy();

  expect(listRt).toBe(detailRt);
});
```

This **FAILS on `main`** (27s 300ms vs 17s 100ms). It is the red test for W1
Task 4. Confirm the failure before fixing:

```bash
bunx playwright test tests/reading-time.spec.ts
```

Expected: 1 failed, with `Expected: "17s 100ms" Received: "27s 300ms"` or the
reverse.

---

## 6. W1 - Route collapse and reading-time fix

**Why together:** the reading-time bug lives in 8 copy-pasted call sites that the
collapse deletes anyway. Fixing it before the collapse means fixing it 8 times.

### 6.1 Current route inventory (28 files)

Root (8): `index.astro`, `404.astro`, `cv.astro`, `authors.astro`, `muses.astro`,
`short_form.astro`, `long_form.astro`, `zeitweilig.astro`

Per collection x 5 (`muses`, `short_form`, `long_form`, `zeitweilig`, `authors`),
4 files each (20): `[...id].astro`, `tags/index.astro`, `tags/[tag].astro`,
`rss.xml.ts`

### 6.2 Verified variance

| Family             | Count | Differs by                                        |
| ------------------ | ----- | ------------------------------------------------- |
| collection index   | 4     | `pageTitle` string + collection literal (2 lines) |
| `[...id].astro`    | 4     | collection literal (2 lines)                      |
| `tags/[tag].astro` | 4     | collection literal (2 lines)                      |
| `tags/index.astro` | 5     | 2 strings (authors included - identical shape)    |
| `rss.xml.ts`       | 5     | 2 strings (identical shape)                       |

**`authors` divergences (3):**

1. `authors.astro` passes no reading time.
2. `authors/[...id].astro` uses `AuthorLayout`, not `MarkdownPostLayout`.
3. `authors/tags/[tag].astro` omits the `minutesRead` prop.

**`cv` is not a route family.** It is a collection in `content.config.ts:58` but
`src/pages/cv.astro` is bespoke (reads `src/content/cv/cv-export.html`). Any
`getStaticPaths` derived from `CollectionName` (`src/scripts/collections.ts:9-16`,
which includes `"cv"`) will over-generate unless filtered.

### 6.3 Target structure

```
src/pages/
  index.astro              (unchanged)
  404.astro                (unchanged)
  cv.astro                 (unchanged)
  _README.md               (rewritten in W5)
  [collection]/index.astro
  [collection]/[...id].astro
  [collection]/tags/index.astro
  [collection]/tags/[tag].astro
  [collection]/rss.xml.ts
```

9 files (8 routes + README), down from 29.

**URL parity risk:** today `/muses/` is emitted by `src/pages/muses.astro`, and
`[collection]/index.astro` must emit the identical path. `astro.config.mjs` sets
no `trailingSlash`, so it defaults to `ignore`; Cloudflare handles the rest via
`wrangler.jsonc:9` `html_handling: "auto-trailing-slash"`. **A silently-dropped
route becomes a production 404** and neither `astro check` nor Playwright will
catch it. The route-manifest diff (W0.1) is the only gate for this.

**Files:**

- Create: `src/config/collections.ts`
- Create: `src/pages/[collection]/index.astro`, `[...id].astro`,
  `tags/index.astro`, `tags/[tag].astro`, `rss.xml.ts`
- Delete: 20 per-collection route files + 4 collection index pages
- Modify: `src/scripts/remark-reading-time.mjs`, `src/scripts/collections.ts`

### Task W1.1: Define the collections config

- [ ] **Step 1: Create `src/config/collections.ts`**

```ts
import type { CollectionName } from "../scripts/collections";

export interface RouteCollection {
  /** Collection name; must match src/content.config.ts and the URL segment. */
  name: Exclude<CollectionName, "cv">;
  /** Title shown on the collection index page. */
  title: string;
  /** Layout used by the detail route. */
  layout: "post" | "author";
  /** Whether list cards and the detail page show reading time. */
  readingTime: boolean;
}

/**
 * Single source of truth for every generated collection route.
 * Adding a collection here creates its index, detail, tag index, tag detail
 * and RSS routes. `cv` is deliberately absent - it has a bespoke page.
 */
export const ROUTE_COLLECTIONS: readonly RouteCollection[] = [
  { name: "muses", title: "Muses", layout: "post", readingTime: true },
  {
    name: "short_form",
    title: "Short Form",
    layout: "post",
    readingTime: true,
  },
  { name: "long_form", title: "Long Form", layout: "post", readingTime: true },
  {
    name: "zeitweilig",
    title: "Zeitweilig",
    layout: "post",
    readingTime: true,
  },
  { name: "authors", title: "Authors", layout: "author", readingTime: false },
] as const;

export function getRouteCollection(name: string): RouteCollection {
  const found = ROUTE_COLLECTIONS.find((c) => c.name === name);
  if (!found) throw new Error(`Unknown route collection: ${name}`);
  return found;
}
```

- [ ] **Step 2: Typecheck**

```bash
bun x astro check
```

Expected: no new errors. `CollectionName` must already be exported from
`src/scripts/collections.ts` - if it is not, export it.

### Task W1.2: Fix the reading-time source of truth

The remark plugin already computes the correct value but list pages cannot reach
it via `getCollection()` alone. Two options were considered:

- **Option A:** call `render(entry)` for each entry on list pages. 60 posts, so
  60 render calls at build. Astro caches renders within a build, and the detail
  routes already render every entry, so the marginal cost is bounded. Correct
  but couples list pages to the render pipeline.
- **Option B (chosen):** have the remark plugin write `readingTimeMs` into the
  entry's frontmatter so it is available from `getCollection()` without
  rendering, and add it to the Zod schema as an optional field.

Option B is chosen because it keeps list pages cheap and makes the value visible
to the schema.

- [ ] **Step 1: Confirm the red test fails**

```bash
bunx playwright test tests/reading-time.spec.ts
```

Expected: FAIL with mismatched values (see W0.4 Step 2).

- [ ] **Step 2: Verify what the remark plugin currently writes**

Read `src/scripts/remark-reading-time.mjs`. It should already set both
`readingTimeMs` and `minutesRead` on `data.astro.frontmatter`. Confirm whether
that frontmatter is surfaced through `getCollection()` in Astro 7 for MDX
entries. **This is the one open technical question in W1** - if remark-injected
frontmatter is NOT visible via `getCollection()`, fall back to Option A.

Test it directly before writing code:

```bash
cat > /tmp/probe.mjs <<'EOF'
// Run inside an astro context is required; instead probe the built output.
EOF
rg -o 'readingTimeMs' src/pages/*/\[...id\].astro | head
```

Then add a temporary `console.log(post.data)` in one list page, run
`bun run build`, and inspect whether `readingTimeMs` is present. Record the
answer here: `______`.

- [ ] **Step 3: Implement the chosen option**

If Option B works, add to `src/content.config.ts` `baseSchema`:

```ts
readingTimeMs: z.number().optional(),
```

and ensure `remark-reading-time.mjs` writes it. If Option B does not work, use
Option A in the collapsed list route:

```astro
---
const entries = await getCollection(collection);
const withReadingTime = await Promise.all(
  entries.map(async (entry) => {
    const { remarkPluginFrontmatter } = await render(entry);
    return { entry, readingTimeMs: remarkPluginFrontmatter.readingTimeMs };
  }),
);
---
```

- [ ] **Step 4: Delete the raw-body computation**

Remove every `import getReadingTime from "reading-time"` and
`getReadingTime(post.body)` call from list and tag pages. After the collapse
there should be exactly **zero** direct `reading-time` imports under
`src/pages/`:

```bash
rg -c 'from "reading-time"' src/pages/ || echo "0 - correct"
```

- [ ] **Step 5: Confirm the test now passes**

```bash
bun run build && bunx playwright test tests/reading-time.spec.ts
```

Expected: PASS. Both values identical.

- [ ] **Step 6: Remove the dead `minutesRead` string**

`remark-reading-time.mjs` computes `minutesRead` ("3 min read") and nothing reads
it. Either delete it or start using it. Decide and note: `______`.

### Task W1.3: Build the parameterised routes

- [ ] **Step 1: Create `src/pages/[collection]/index.astro`**

```astro
---
import { getCollection } from "astro:content";
import {
  ROUTE_COLLECTIONS,
  getRouteCollection,
} from "../../config/collections";
// plus the same layout + component imports the current muses.astro uses

export async function getStaticPaths() {
  return ROUTE_COLLECTIONS.map((c) => ({ params: { collection: c.name } }));
}

const { collection } = Astro.params;
const config = getRouteCollection(collection!);
const posts = await getCollection(config.name);
---
```

Port the body verbatim from `src/pages/muses.astro`, substituting `config.title`
for the hardcoded `pageTitle` and gating the reading-time prop on
`config.readingTime`.

- [ ] **Step 2: Create the other four route files**

Same pattern. `[...id].astro` selects the layout on `config.layout`:

```astro
---
import MarkdownPostLayout from "../../layouts/MarkdownPostLayout.astro";
import AuthorLayout from "../../layouts/AuthorLayout.astro";
const Layout = config.layout === "author" ? AuthorLayout : MarkdownPostLayout;
---

<Layout {...props}><slot /></Layout>
```

Note: Astro requires the dynamic-component variable to be capitalised. If
`astro check` complains about the union of layout prop types, give each layout a
shared `Props` interface or narrow with an explicit branch instead of a variable.

- [ ] **Step 3: Delete the 24 superseded files**

```bash
git rm src/pages/{muses,short_form,long_form,zeitweilig,authors}.astro
git rm -r src/pages/{muses,short_form,long_form,zeitweilig,authors}
```

Careful: this removes `authors.astro` too, which is intentional - `authors` is in
`ROUTE_COLLECTIONS`.

- [ ] **Step 4: Verify route parity - THE critical gate**

```bash
bun run build
./scripts/capture-routes.sh /tmp/routes-after.txt
diff /tmp/routes-baseline.txt /tmp/routes-after.txt && echo "ROUTE PARITY OK"
```

Expected: **no diff**. Any line in the diff is a broken URL in production. Do not
proceed past this step with a non-empty diff.

- [ ] **Step 5: Run the link and HTML gates**

```bash
bun run lint:html && bun run lint:links
```

- [ ] **Step 6: Full suite**

```bash
bunx playwright test
```

Expected: all green except the known-failing ScrollToTop background test (bug
3.2), which W2 fixes.

- [ ] **Step 7: Confirm the file count**

```bash
git ls-files 'src/pages/**' | grep -v README | wc -l
```

Expected: `8`.

---

## 7. W2 - React removal

### 7.1 Behaviour inventory (the acceptance criteria)

Read from source. Every item must survive.

**`ThemeToggle.tsx` (72 lines)**

- 30x30 transparent borderless button, flex-centred.
- `aria-label` toggles between "Switch to light theme" / "Switch to dark theme"
  based on current `.dark` state.
- Inline SVG: `<circle>` with `r=5` when dark, `r=9` when light, transitioned
  over 300ms via `transition-all`.
- A `<g>` of 8 ray `<line>`s: `opacity 1 / scale(1)` when dark,
  `opacity 0 / scale(0.3)` when light, `transformOrigin: center`, 300ms.
- `MutationObserver` on `document.documentElement` `attributeFilter: ["class"]`
  keeps the button's visual state in sync with external theme changes.
- Click dispatches `window.dispatchEvent(new Event("theme-toggle"))`. It does NOT
  toggle the theme itself.

**Contract with `src/scripts/theme.ts`:** `initTheme()` calls
`applyTheme(getThemePreference())`, then (once only, guarded by an `initialized`
flag) registers `window.addEventListener("theme-toggle", toggleTheme)` and
`document.addEventListener("astro:after-swap", ...)` to re-apply on client-side
navigation. `localStorage` key is `"theme"`, values `"light"` / `"dark"`, all
access wrapped in `try/catch`. Falls back to
`matchMedia("(prefers-color-scheme: dark)")`.

**Replacement:** an Astro component with the same markup and a small inline
script. The `r` attribute and ray opacity can be driven by CSS off the
`html.dark` class instead of JS state, which removes the MutationObserver
entirely. `r` is animatable as a CSS property on SVG geometry in modern browsers

- **verify this renders correctly before relying on it**; if not, set `r` from
  the script.

**`Hamburger.tsx` (108 lines)**

- 30x30 transparent borderless button with class `hamburger`.
- `aria-label` "Open menu" / "Close menu"; `aria-expanded` bound to state;
  `aria-controls="nav-links"`.
- Three 2px `<span>` bars in a 24x18 box. Open state: top bar
  `translateY(8px) rotate(45deg)`, middle `opacity 0`, bottom
  `translateY(-8px) rotate(-45deg)`. All 300ms.
- On open: `#nav-links` gets `.open`, loses `.collapsed`, and `inert` is removed.
- On close: `#nav-links` gets `.collapsed`, loses `.open`, and `inert` is set.
- Closes on `Escape` keydown (only when open).
- Closes on click outside, ignoring clicks inside `#nav-links` or on
  `.hamburger`.
- Closes on `astro:page-load` (view-transition navigation).

**This component holds no rendering state that React is needed for** - it reads
and writes `#nav-links` imperatively. A plain script is a direct translation.

**`ScrollToTop.tsx` (49 lines)**

- Renders nothing until `window.scrollY > 300`.
- Scroll listener is `{ passive: true }` and rAF-throttled via a `ticking` ref.
- `cancelAnimationFrame` on unmount.
- Click calls `window.scrollTo({ top: 0, behavior: "smooth" })`.
- `aria-label="Scroll to top"`, fixed bottom-right, rounded-full, shadow.
- **Its `bg-primary` / `text-primary-foreground` / `ring-primary` classes resolve
  to nothing (bug 3.2). Pick real colours in the replacement.**

**`HeroImage.tsx` (191 lines)** - see W4; blocked on the parallax decision.

### 7.2 Mount points

| File                                   | Line      | Usage                                                                  |
| -------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `src/components/Header.astro`          | 2, 77     | `import Hamburger from "./Hamburger.tsx"`, `<Hamburger client:idle />` |
| `src/components/Header.astro`          | 4, 74     | `import ThemeToggle from "./ThemeToggle.astro"`, `<ThemeToggle />`     |
| `src/components/ThemeToggle.astro`     | 2, 5      | wraps `<ThemeToggleComponent client:idle />`                           |
| `src/layouts/BaseLayout.astro`         | 5, 214    | `<ScrollToTop client:idle />`                                          |
| `src/layouts/MarkdownPostLayout.astro` | 7, 95-96  | `<HeroImage ... client:load>`                                          |
| **`src/pages/cv.astro`**               | **3, 68** | **imports the `.tsx` directly, `client:load` - easy to miss**          |

### Task W2.1: Replace ThemeToggle

**Files:** Modify `src/components/ThemeToggle.astro`; Delete
`src/components/ThemeToggle.tsx`; Modify `src/pages/cv.astro:3,68`

- [ ] **Step 1: Confirm the hardened test currently passes**

```bash
bunx playwright test tests/theme.spec.ts
```

- [ ] **Step 2: Rewrite `ThemeToggle.astro` as a self-contained component**

Move the SVG markup from the `.tsx` into the `.astro` file. Drive the dark-state
visuals from CSS on `html.dark` rather than a React `isDark` variable:

```css
/* light (default) */
.theme-toggle circle {
  r: 9;
  transition: r 300ms;
}
.theme-toggle .rays {
  opacity: 0;
  transform: scale(0.3);
  transform-origin: center;
  transition:
    opacity 300ms,
    transform 300ms;
}
/* dark */
html.dark .theme-toggle circle {
  r: 5;
}
html.dark .theme-toggle .rays {
  opacity: 1;
  transform: scale(1);
}
```

The script only needs to dispatch the event and keep `aria-label` current:

```astro
<script>
  import { initTheme } from "../scripts/theme";
  initTheme();
  function wire() {
    document
      .querySelectorAll<HTMLButtonElement>(".theme-toggle")
      .forEach((btn) => {
        if (btn.dataset.wired) return;
        btn.dataset.wired = "1";
        btn.addEventListener("click", () =>
          window.dispatchEvent(new Event("theme-toggle")),
        );
      });
    syncLabels();
  }
  function syncLabels() {
    const dark = document.documentElement.classList.contains("dark");
    document
      .querySelectorAll(".theme-toggle")
      .forEach((b) =>
        b.setAttribute(
          "aria-label",
          dark ? "Switch to light theme" : "Switch to dark theme",
        ),
      );
  }
  wire();
  document.addEventListener("astro:page-load", wire);
  new MutationObserver(syncLabels).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
</script>
```

- [ ] **Step 3: Fix the second call site**

`src/pages/cv.astro:3` imports `../components/ThemeToggle` which resolves to the
`.tsx`. Point it at the `.astro` and drop `client:load` at `:68`.

- [ ] **Step 4: Delete the React file and verify**

```bash
git rm src/components/ThemeToggle.tsx
bun run build && bunx playwright test tests/theme.spec.ts
```

Expected: PASS. Also verify the `r` animation renders - if the circle does not
resize, set `r` from `syncLabels()` via `setAttribute`.

### Task W2.2: Replace Hamburger

**Files:** Create `src/components/Hamburger.astro`; Delete
`src/components/Hamburger.tsx`; Modify `src/components/Header.astro:2,77`

- [ ] **Step 1: Port markup + script**

Bars animate off an `.is-open` class on the button, set by the script. The script
is a direct translation of the four `useEffect`s: click-to-toggle, Escape,
click-outside, and `astro:page-load` reset. Preserve `aria-expanded`,
`aria-controls="nav-links"`, the `.open`/`.collapsed` class swap on `#nav-links`,
and the `inert` toggle.

- [ ] **Step 2: Verify**

```bash
bun run build && bunx playwright test tests/navigation.spec.ts
```

Expected: PASS including the `aria-expanded`, `.open`/`.collapsed`, `inert`, and
Escape assertions added in W0.3.

### Task W2.3: Replace ScrollToTop and delete the shadcn chain

**Files:** Create `src/components/ScrollToTop.astro`; Delete
`src/components/ScrollToTop.tsx`, `src/components/ui/button.tsx`,
`src/components/ui/utils.ts`, `components.json`; Modify
`src/layouts/BaseLayout.astro:5,214`

- [ ] **Step 1: Port with real colours**

Render the button always but hide it with CSS until scrolled, or keep the
show/hide in script. Replace `bg-primary text-primary-foreground ring-primary`
with defined tokens - match the site palette (`#222125` dark surface / `#f2f2f2`
light) rather than inventing new ones. Inline the chevron SVG; do not add an icon
dependency.

- [ ] **Step 2: Flip the expected-fail test**

Change `test.fail()` to `test()` in `tests/islands.spec.ts` for the background
assertion.

- [ ] **Step 3: Delete the chain and verify nothing else imported it**

```bash
git rm src/components/ScrollToTop.tsx src/components/ui/button.tsx \
       src/components/ui/utils.ts components.json
rg -n 'ui/button|ui/utils|lucide-react|class-variance-authority|tailwind-merge|clsx' src/ \
  && echo "STILL REFERENCED - fix before continuing" || echo "clean"
```

- [ ] **Step 4: Verify**

```bash
bun run build && bunx playwright test tests/islands.spec.ts
```

### Task W2.4: Strip React from config and dependencies

**Files:** Modify `astro.config.mjs:12,47`, `tsconfig.json:5-6`, `package.json`,
`scripts/sync-readme-versions.js:29,43`, `README.md:5`

- [ ] **Step 1: Fix the version-sync script FIRST**

This must land before or with the dependency removal, or the next build writes a
`React-unknown-61DAFB` badge into `README.md` (bug 3.4).

Delete the `react: clean(pkg.dependencies["react"])` entry at
`scripts/sync-readme-versions.js:29`, the badge rule at `:43`, and the badge line
at `README.md:5`.

- [ ] **Step 2: Remove the integration**

Delete `import react from "@astrojs/react"` (`astro.config.mjs:12`) and `react()`
from the `integrations` array (`:47`).

**Do NOT touch `vite.build.assetsInlineLimit` (`:132-137`).** It is documented in
AGENTS.md as the fix for the `__VITE_PRELOAD__` ReferenceError that broke
Pagefind's lazy import. W2 reduces the chunk count, which may make the veto look
unnecessary. It is not.

- [ ] **Step 3: Remove the JSX tsconfig keys**

Delete `"jsx": "react-jsx"` and `"jsxImportSource": "react"` from
`tsconfig.json:5-6`. Keep `allowJs` - the `.mjs` and `scripts/*.js` files need it.
Leaving `jsxImportSource` after uninstalling `@types/react` makes `astro check`
fail to resolve `react/jsx-runtime`.

- [ ] **Step 4: Uninstall**

```bash
bun remove @astrojs/react react react-dom @types/react @types/react-dom \
           lucide-react class-variance-authority @radix-ui/react-slot \
           tailwind-merge clsx
```

- [ ] **Step 5: Verify the removal is total**

```bash
test -z "$(git ls-files 'src/**/*.tsx')" && echo "0 tsx files - OK"
jq -r '.dependencies | length' package.json    # expect 22
rg -q 'jsxImportSource' tsconfig.json && echo "FAIL" || echo "tsconfig clean"
rg -q '@astrojs/react' astro.config.mjs && echo "FAIL" || echo "config clean"
bun x astro check
```

- [ ] **Step 6: Measure the win**

```bash
bun run build
( shopt -s globstar; stat -c '%s %n' dist/**/*.js | grep -v pagefind | sort -rn ) \
  > /tmp/js-after.txt
diff /tmp/js-baseline.txt /tmp/js-after.txt
( shopt -s globstar; stat -c '%s' dist/**/*.js | grep -v pagefind ) \
  | paste -sd+ | bc
```

Expected total: approximately **32,000 bytes** (down from 262,990). Record the
actual: `______`.

- [ ] **Step 7: Full gate**

```bash
./scripts/capture-routes.sh /tmp/routes-after-w2.txt
diff /tmp/routes-baseline.txt /tmp/routes-after-w2.txt && echo "ROUTES OK"
bun run lint:site
bunx playwright test
```

**Note on CI:** removing 10 deps changes `bun.lock`, and both
`.github/workflows/deploy.yml:47` and `:49` key the Astro image cache on
`hashFiles('**/bun.lock')` including the `restore-keys` prefix. The first
post-W2 CI build will be a **cold 5-8 minute image build** on both
`build-revista` and `deploy-to-github-pages`. This is expected, not a failure.

---

## 8. W3 - Tailwind v4 native config

Risk is LOW per the section 4 empirical finding. The only real hazard is
breakpoint merge semantics.

**Files:** Modify `src/styles/global.css:1-41`; Delete `tailwind.config.mjs`

### Task W3.1: Delete the dead config (own commit, zero risk)

- [ ] **Step 1: Remove the inert keys**

Delete `tailwind.config.mjs:13-22` (`objectPosition`, `backgroundPosition`,
`backgroundSize`) and the `"2xl": "3800px"` screen. All verified unused and
unreadable by v4 (bug 3.3).

- [ ] **Step 2: Verify zero CSS change**

```bash
bun run build
diff <(bun x prettier --parser css /tmp/css-baseline.css) \
     <(bun x prettier --parser css dist/_astro/BaseLayout.*.css) \
  && echo "IDENTICAL CSS - dead config confirmed"
```

Expected: **no diff at all.** If there is one, the config was not dead and this
step must be reverted and re-analysed.

### Task W3.2: Move config into CSS

- [ ] **Step 1: Replace `@config` in `global.css`**

Replace line 12 (`@config '../../tailwind.config.mjs';`) with:

```css
@plugin "@tailwindcss/typography";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-overpass-mono: var(--font-overpass-mono), "Overpass Mono", monospace;
  --font-inconsolata: var(--font-inconsolata), Inconsolata, monospace;

  /* v3 theme.screens REPLACED defaults; v4 @theme MERGES. Clear the
     defaults explicitly so 640/768/1024/1280 do not co-exist with ours. */
  --breakpoint-*: initial;
  --breakpoint-sm: 800px;
  --breakpoint-md: 1200px;
  --breakpoint-lg: 1900px;
  --breakpoint-xl: 2500px;
}
```

Keep `@utility prose-no-quotes` (`:14-24`) - already native v4 syntax and still
load-bearing (it is the only suppressor of the typography plugin's
`open-quote`/`close-quote` pseudo-elements, used at `Prose.astro:6`).

Keep the `@layer base` border-color shim (`:26-41`) this round. It is
independent of `@config`; retiring it in the same commit would make any visual
regression ambiguous between two causes.

- [ ] **Step 2: Delete the config file**

```bash
git rm tailwind.config.mjs
```

- [ ] **Step 3: Run the canaries - THE gate**

```bash
bun run build
bunx playwright test tests/styling.spec.ts
```

Expected: all 6 pass. The breakpoint test is the one that catches a bad
`--breakpoint-*: initial`.

- [ ] **Step 4: Diff the CSS output**

```bash
diff <(bun x prettier --parser css /tmp/css-baseline.css) \
     <(bun x prettier --parser css dist/_astro/BaseLayout.*.css) > /tmp/css.diff
wc -l /tmp/css.diff
```

Some diff is expected (ordering, the dropped dead utilities). Review it. Assert
specifically that `.prose` is still inside `@layer utilities` and that
`.max-w-7xl` still follows it:

```bash
rg -n '@layer utilities' /tmp/pretty-after.css | head -1
```

- [ ] **Step 5: Delete the obsolete comment**

Only after step 3 is green, delete `global.css:3-11` (the `require()` vs ESM
rationale). It is now provably not applicable to tailwindcss 4.2.2.

- [ ] **Step 6: Verify the whole site**

```bash
bun run lint:site && bunx playwright test
```

---

## 9. W4 - HeroImage / parallax decision (BLOCKED)

`HeroImage.tsx` (191 lines) is the only island with a real justification: rAF +
lerp scroll parallax with `IntersectionObserver` gating, `will-change:
transform`, and a `-20% / 120%` oversized inner container.

Three exits, needs a user decision:

1. **Drop the parallax.** Static hero image. `design-utilitarian` #4 lists
   parallax as animation tax. Simplest, removes 191 lines and the last island.
2. **Port to CSS `animation-timeline: scroll()`.** Keeps the effect at zero JS.
   **Browser support is NOT verified in this session** - check before committing.
3. **Keep it as a vanilla script.** Direct translation, no React, ~60 lines.
   Keeps the effect with certain support.

`docs/depth-parallax-research.md:83` records the existing formula
(`translate3d(0, scrollY * 0.3, 0)` with the `top:-20% / height:120%` container)
and is the implementation spec for options 2 and 3. Read it before rewriting.

**Coverage warning:** HeroImage has **zero tests**. `blog-posts.spec.ts:4`
("post with image renders hero") actually asserts
`page.locator("[data-pagefind-body]")` and never touches the hero. Everything in
`docs/performance.md:176-198` (rAF batching, `lerpSpeed = 0.1`,
IntersectionObserver gating, `fetchPriority="high"`, `decoding="sync"`,
`prefers-reduced-motion`) is unverified behaviour that a rewrite would
reimplement blind. Add a spec before touching it whichever option is chosen.

Also note a pre-existing doc conflict to resolve during the rewrite:
`docs/performance.md:198` claims a hidden screen-reader `<img>` exists;
`src/components/README.md:19` says there is no separate sr-only element.

---

## 10. Loop harness setup

The loop reads a fixed path, `.pi/harness.json`. That file currently holds the
**docs-accuracy** manifest (12 doc files, code frozen). Do not clobber it.

- [ ] **Step 1: Park the existing manifest**

```bash
cd <repo>
cp .pi/harness.json .pi/harness.docs.json
git add .pi/harness.docs.json
```

- [ ] **Step 2: Write one manifest per workstream, swap into place per run**

Store as `.pi/harness.w1.json`, `.pi/harness.w2.json`, `.pi/harness.w3.json`,
then `cp .pi/harness.w2.json .pi/harness.json` before each `loop run`.

**Key differences from the docs harness:**

| Aspect          | Docs harness             | Refactor harness                                                                                                                      |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `writeScope`    | 12 doc files + `docs/**` | `src/**`, `tests/**`, `astro.config.mjs`, `tsconfig.json`, `package.json`, `tailwind.config.mjs` - but **exclude `src/content/**`\*\* |
| Sensor cost     | sub-second               | `bun run build` dominates; stage cheap sensors first                                                                                  |
| `maxIterations` | 8                        | 4-5 (build cost per iteration is much higher)                                                                                         |

**Sensors to include, per workstream:**

W1 (routes + reading time):

```json
{ "name": "route-parity",
  "cmd": "./scripts/capture-routes.sh /tmp/r.txt && diff /tmp/routes-baseline.txt /tmp/r.txt",
  "hint": "A route was added or dropped. Every URL in the baseline must still be emitted." },
{ "name": "no-raw-reading-time",
  "cmd": "! rg -q 'from \"reading-time\"' src/pages/",
  "hint": "List pages must use the remark plugin's readingTimeMs, not getReadingTime(post.body)." },
{ "name": "page-count",
  "cmd": "[ \"$(git ls-files 'src/pages/**' | grep -v README | wc -l)\" -le 9 ]",
  "hint": "The per-collection route files should be collapsed into [collection]/ routes." }
```

W2 (React removal):

```json
{ "name": "no-tsx",       "cmd": "[ -z \"$(git ls-files 'src/**/*.tsx')\" ]" },
{ "name": "no-react-dep", "cmd": "! jq -e '.dependencies.react' package.json" },
{ "name": "no-jsx-ts",    "cmd": "! rg -q 'jsxImportSource' tsconfig.json" },
{ "name": "no-react-integration", "cmd": "! rg -q '@astrojs/react' astro.config.mjs" },
{ "name": "inline-limit-veto-intact",
  "cmd": "rg -q 'assetsInlineLimit' astro.config.mjs",
  "hint": "The assetsInlineLimit veto is load-bearing for Pagefind. Do not remove it." },
{ "name": "no-react-badge",
  "cmd": "! rg -q 'React-unknown' README.md" }
```

W3 (Tailwind):

```json
{ "name": "no-config-directive", "cmd": "! rg -q '@config' src/styles/global.css" },
{ "name": "no-config-file",      "cmd": "! test -f tailwind.config.mjs" }
```

All three also need: `bun x astro check`, `bun x prettier --check .`,
`bun run build`, `bunx playwright test`, and a judge sensor with a
behaviour-preservation spec (not the docs-accuracy spec).

**Judge spec must carry explicit anti-regression clauses** about the
`assetsInlineLimit` veto and the custom breakpoints - both are non-obvious and
an eager model will "simplify" them away.

- [ ] **Step 3: Restore the docs manifest when done**

```bash
cp .pi/harness.docs.json .pi/harness.json
```

---

## 11. W5 - Documentation sweep

`.pi/check-doc-refs.sh` only sees **backtick-quoted** paths starting `src/`,
`scripts/`, `public/`, or `docs/`, and skips any containing `{}`, `*`, `<`, `>`.
It will hard-fail on these five, which is useful:

| Doc:line                  | Path                                | Broken by |
| ------------------------- | ----------------------------------- | --------- |
| `README.md:392`           | `src/pages/muses.astro`             | W1        |
| `README.md:393`           | `src/pages/long_form/[...id].astro` | W1        |
| `README.md:404`           | `src/pages/authors.astro`           | W1        |
| `docs/performance.md:176` | `src/components/HeroImage.tsx`      | W2/W4     |
| `AGENTS.md:113`           | `src/components/ui/button.tsx`      | W2        |

Everything below is **invisible to the sensor** and must be done by hand.

### Per-file checklist

- [ ] **`README.md`** - :5 React badge (delete); :7 stale MDX badge (fix to
      7.0.5); :50 mermaid config-files node; :82, :84 mermaid `HeroImage.tsx` /
      `ThemeToggle.tsx` nodes; :127 global.css description; :145
      `tailwind.config.mjs`; :152 breakpoints; :336-397 whole Routing section + 3
      mermaid diagrams; :409-412 `{collection}` route table (**already factually
      wrong today** - it claims indexes live at `{collection}/index.astro`, which
      only becomes true after W1); :421-467 Styling System incl. the
      `tailwind.config.mjs` code block; :472 "ThemeToggle.tsx React component";
      :475-491 `global.css` sample showing `@config`; :498 "CSS-in-JS in the React
      components"; :512-518 `theme.ts` description; :567 remark-reading-time; :602,
      :679-681 Tailwind; :683-685 test count; :801-803 install list incl. React.
- [ ] **`AGENTS.md`** - :6 "React islands"; :19 project map `ui/` line; :78
      prebuild behaviour; :113 `ui/button.tsx`; :124-125 tsconfig jsx keys;
      **:134-141 the whole "React Island Patterns" section** (replace with a
      vanilla-script section); :148-158 "Styling and Tailwind" (:150 `@config`,
      :151 dark mode, **:155 the `require()` instruction becomes false**); :163
      `ThemeToggle.tsx` naming exemplar. **Preserve :84-85 verbatim** (the
      `assetsInlineLimit` rationale).
- [ ] **`src/README.md`** - **:9-63 the entire "React + Astro Integration"
      section needs a full rewrite**; :124-161 the Tailwind config code blocks;
      :271-297 Tag System Architecture + route mapping. Also fix the pre-existing
      stale :224-250 image-service block (it documents the old sharp service;
      `astro.config.mjs:31-39` uses `hqService`). **Do not regress :253-270** - the
      Search section is currently accurate.
- [ ] **`src/components/README.md`** - :7 "React `.tsx` islands"; :19 HeroImage;
      :26 Hamburger; :27 ThemeToggle; :52 markdown link to `../../tailwind.config.mjs`
      (dangling after W3, sensor-invisible); :66 ScrollToTop; :69 hydration
      directives; **:70-73 delete the "UI Primitives" subsection**; :78 the
      "unlike React" aside; :93 add the React removal to "Removed Components".
- [ ] **`src/layouts/README.md`** - :11 scroll-to-top; :13 HeroImage island;
      :39-43 Type Safety `collection` prop (re-verify after W1); :47 breakpoints.
- [ ] **`src/pages/_README.md`** - near-total rewrite. :20-30 the 5 separate
      index pages with relative links; :32-40 Dynamic Pages; :42-63 Dynamic Routing
  - `getStaticPaths` sample; :65-77 RSS (5 feeds -> 1 parameterised);
    :79-82 Type Safety.
- [ ] **`scripts/README.md`** - :382-386 `sync-readme-versions.js` description
      (the react rule is gone).
- [ ] **`docs/README.md`** - :11 "Astro/React components"; :15 the shared-utilities
      list is already incomplete (omits `pagefind.ts`, `theme.ts`, `lightbox.ts`,
      `utils.ts`, `homePage.ts`, `getRandomImage.ts`, `burgundy.ts`, `rss.ts`,
      `since94.ts`, `undici-retry.ts`, `remark-reading-time.mjs`).
- [ ] **`docs/performance.md`** - :20-32 Islands Architecture rationale (rewrite:
      zero framework JS is a better story than selective hydration); **:73 is
      actively false today** ("no explicit `content` configuration is needed") and
      becomes true only after W3; :174-190 Hero Image section incl. the `.tsx` path
      at :176 and the "React hydration" claim at :189; :198 the sr-only `<img>`
      claim conflicting with `src/components/README.md:19`.
- [ ] **`docs/depth-parallax-research.md`** - :3 becomes historically ambiguous
      after W4. Also check whether `public/depth-maps/` still exists (:12).
- [ ] **`src/content/README.md`** - :78 says "Astro v6.1", stale (7.1.5). **This
      file is in neither `harness.json`'s file list nor `check-doc-refs.sh`** - a
      pre-existing sensor gap. Add it to both.
- [ ] **`docs/docker.md`** - no changes needed. Verified.

- [ ] **Final gate**

```bash
.pi/check-doc-refs.sh && bun x prettier --check .
```

---

## 12. Risk register

| #   | Risk                                                              | Severity                                                            | Mitigation                                                         |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | A route silently disappears in W1                                 | **HIGH** - production 404 via `wrangler.jsonc` `not_found_handling` | Route-manifest diff (W0.1 + W1.3 Step 4). Nothing else catches it. |
| 2   | W2 replacement renders nothing; conditional tests pass green      | **HIGH**                                                            | W0.3 converts guards to hard assertions BEFORE W2                  |
| 3   | `--breakpoint-*` merge leaves v4 defaults alongside custom values | MEDIUM                                                              | W0.2 breakpoint canary                                             |
| 4   | `prebuild` writes `React-unknown` badge to README                 | MEDIUM - ships to repo front page                                   | W2.4 Step 1 fixes the script first                                 |
| 5   | `assetsInlineLimit` veto removed as "no longer needed"            | MEDIUM - breaks Pagefind silently                                   | Dedicated sensor + judge anti-regression clause                    |
| 6   | `cv.astro:3` React import missed (second call site)               | MEDIUM                                                              | Explicit step W2.1 Step 3 + `rg` sweep                             |
| 7   | Astro rejects the dynamic layout union in `[...id].astro`         | LOW                                                                 | Fall back to an explicit branch instead of a component variable    |
| 8   | `getCollection()` cannot see remark frontmatter                   | LOW                                                                 | W1.2 Step 2 probes this first; Option A fallback documented        |
| 9   | First CI build after W2 is a cold 5-8 min image build             | LOW - expected                                                      | Documented; do not treat as a failure                              |
| 10  | CSS `r` property animation unsupported                            | LOW                                                                 | W2.1 Step 4 verifies; fall back to script `setAttribute`           |

**Structural risk: CI runs only `bun run build`.** Neither workflow runs
`astro check`, `prettier --check`, `lint:html`, `lint:links`, or
`playwright test`. Every gate in this plan is local-only. Consider adding a CI
job as part of this work, or the protections lapse the moment someone else
pushes.

---

## 13. Verified vs unverified

**Verified in-session (tool output, this branch):** all byte counts and file
counts in section 2; the reading-time divergence table (built HTML, 4 posts); the
zero-CSS shadcn tokens; the dead Tailwind config keys; `.prose` inside
`@layer utilities` with `.max-w-7xl` after it; custom breakpoints emitting at
800/1200/1900/2500 with no 3800; `darkMode` compiling to `:is(.dark *)`; the
full behaviour inventory of all four islands (read from source); all six mount
points; the `sync-readme-versions.js` `"unknown"` code path.

**Not verified - resolve before relying on:**

- Whether `@plugin` produces byte-identical output to `@config` + `require()`.
  Strongly inferred from shared code paths (section 4), but only the W3.2 Step 4
  CSS diff proves it.
- v4 `--breakpoint-*: initial` reset semantics.
- Whether `getCollection()` surfaces remark-injected frontmatter in Astro 7.
- CSS `animation-timeline: scroll()` browser support (W4 option 2).
- CSS `r` property animation support on SVG geometry (W2.1).
- Whether v4 source auto-detection still scans `src/content/cv/cv-export.html`
  after `content:` is dropped. That file's classes currently feed the bundle;
  a silent drop would strip CV page utilities. Check bundle size before/after.

---

## 14. Expected end state

|                      | Before                                                         | After                                   |
| -------------------- | -------------------------------------------------------------- | --------------------------------------- |
| Runtime JS           | 262,990 B                                                      | ~32,000 B                               |
| Runtime dependencies | 32                                                             | 22                                      |
| Route files          | 28                                                             | 8                                       |
| `.tsx` files         | 5                                                              | 0                                       |
| Root config files    | `astro.config.mjs` + `tailwind.config.mjs` + `components.json` | `astro.config.mjs`                      |
| Framework            | Astro + React                                                  | Astro                                   |
| Emitted URLs         | 76 HTML pages                                                  | 76 HTML pages (byte-identical manifest) |
| Reading time         | inconsistent list vs detail                                    | single source of truth                  |
| Playwright specs     | 12 files / 74 tests                                            | 15 files / ~85 tests                    |

Same features, same output, same URLs. The delivered page is HTML + CSS with a
small amount of progressive-enhancement script, and the generator that turns 60
MDX files into 76 pages stays.
