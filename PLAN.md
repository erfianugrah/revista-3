# Refactoring Plan

Branch: `refactor/code-quality-improvements`
Base: `main` @ `027a5d2`

---

## Phase 1: Bug Fixes (High Priority)

### 1.1 Fix swapped date props in MarkdownPostLayout

- **File:** `src/layouts/MarkdownPostLayout.astro:77-78`
- **Problem:** `pubDate={updatedDate}` and `updatedDate={publishedDate}` are reversed, corrupting OG/meta date tags.
- **Fix:** Swap them back: `pubDate={publishedDate}` and `updatedDate={updatedDate}`.

### 1.2 Fix RSS typo preventing Zeitweilig RSS link

- **File:** `src/scripts/rss.js:2`
- **Problem:** `"/zeitweillig/"` has a double "l". The RSS icon never appears on the Zeitweilig listing page.
- **Fix:** Change to `"/zeitweilig/"`.

### 1.3 Fix unsafe access on optional `updatedDate`

- **Files:** `src/layouts/MarkdownPostLayout.astro:11-15`, `src/layouts/AuthorLayout.astro:7-11`
- **Problem:** `frontmatter?.updatedDate.toDateString()` -- optional chaining on `frontmatter` doesn't protect `updatedDate` which is `z.coerce.date().optional()`. Throws at runtime if undefined.
- **Fix:** Add null guard: `frontmatter?.updatedDate?.toDateString()...` with a fallback (empty string or omit the element).

---

## Phase 2: DRY Up Schemas & Shared Utilities (Medium-High Priority)

### 2.1 Extract shared content schema

- **File:** `src/content.config.ts`
- **Problem:** The same 13-line Zod schema is copy-pasted 5 times for muses, short_form, long_form, zeitweilig, authors.
- **Fix:** Extract a `baseSchema` constant. CV schema extends it with `.extend({...})`. Remove stale `// type: "content"` comments.

### 2.2 Extract shared Fisher-Yates shuffle utility

- **Files:** `src/scripts/burgundy.js:23-30`, `homePage.js:25-28`, `homePageMasonry.js:19-22`, `getrandomimage.js:26-29`, `src/components/NextPost.astro:112-118`
- **Problem:** Same algorithm duplicated 5 times.
- **Fix:** Create `src/scripts/utils.ts` with an exported `shuffle<T>(array: T[]): T[]` function. Import it in all consumers.

### 2.3 Extract shared date formatting utility

- **Files:** `src/layouts/MarkdownPostLayout.astro:11-20`, `src/layouts/AuthorLayout.astro:7-16`
- **Problem:** Identical date-to-string logic duplicated.
- **Fix:** Add a `formatDate(date: Date): string` function to `src/scripts/utils.ts`. Use it in both layouts.

---

## Phase 3: Performance Quick Wins (Medium Priority)

### 3.1 Switch React island hydration from `client:load` to `client:idle`

- **Files:** `src/layouts/BaseLayout.astro:176` (ScrollToTop), `src/components/Header.astro:43` (Hamburger), `src/components/ThemeToggle.astro:5` (ThemeToggle)
- **Problem:** Framer Motion bundles load eagerly on every page via `client:load`.
- **Fix:** Change to `client:idle` -- these components are not needed until user interaction.

---

## Phase 4: Dead Code Removal (Medium Priority)

### 4.1 Remove fully commented-out Greeting.jsx

- **File:** `src/components/Greeting.jsx`
- **Action:** Delete the file.

### 4.2 Remove unused Search.astro

- **File:** `src/components/Search.astro`
- **Action:** Verify it is not imported anywhere, then delete. `Pagefind.astro` is the active search component.

### 4.3 Remove unused global `window.toggleMenu` in menu.js

- **File:** `src/scripts/menu.js`
- **Action:** The `Hamburger.tsx` React component handles all toggle logic. Verify `window.toggleMenu` is never called, then remove the dead function (or the entire file if nothing else in it is used).

### 4.4 Remove empty glightbox.min.css

- **File:** `src/styles/glightbox.min.css`
- **Action:** 0-byte file. Delete it.

### 4.5 Remove stale config.ts.bak

- **File:** `src/content/config.ts.bak`
- **Action:** Delete the backup file.

---

## Phase 5: Consistency & Safety Fixes (Medium-Low Priority)

### 5.1 Fix broken style assignment in homePageMasonry.js

- **File:** `src/scripts/homePageMasonry.js:33,38`
- **Problem:** `element.style = { display: 'inline-block' }` is a no-op in the DOM.
- **Fix:** Use `Object.assign(element.style, {...})` or set individual properties.

### 5.2 Add `rel="noopener noreferrer"` to external links

- **File:** `src/components/Footer.astro:13,17,21,25`
- **Problem:** `target="_blank"` links without `rel="noopener noreferrer"` are a security concern.
- **Fix:** Add the attribute to all external footer links.

### 5.3 Replace deprecated `window.pageYOffset`

- **Files:** `src/components/HeroImage.tsx:49`, `src/components/scroll-to-top.tsx:12`
- **Fix:** Change to `window.scrollY`.

### 5.4 Add `aria-label` to Pagefind close button

- **File:** `src/components/Pagefind.astro:14`
- **Fix:** Add `aria-label="Close search"` to the close button.

---

## Phase 6: Additional Fixes (completed)

### 6.1 Remove duplicate `astro:after-swap` listener in lightbox.js

- **File:** `src/scripts/lightbox.js:22`
- **Problem:** `astro:page-load` already fires after every navigation; the duplicate `astro:after-swap` listener causes GLightbox to initialize twice on client-side navigations.
- **Fix:** Remove the `astro:after-swap` listener.

### 6.2 Fix shell injection in remark-modified-time.mjs

- **File:** `src/scripts/remark-modified-time.mjs:6`
- **Problem:** Filepath interpolated directly into `execSync()` shell command string.
- **Fix:** Replace `execSync` with `execFileSync` using an argument array.

### 6.3 Parallelize image loads in filterportraitimages.js

- **File:** `src/scripts/filterportraitimages.js`
- **Problem:** Sequential `await` in a `for` loop loads images one at a time.
- **Fix:** Rewrite with `Promise.all` for parallel loading.

### 6.4 Remove unused `pageTitle` in index.astro

- **File:** `src/pages/index.astro:3`
- **Problem:** `pageTitle` destructured from `Astro.props` but never passed (always undefined).
- **Fix:** Remove the destructuring; pass `"Home"` directly as title.

### 6.5 Delete unused HomepageMasonry.astro + homePageMasonry.js

- **Files:** `src/components/HomepageMasonry.astro`, `src/scripts/homePageMasonry.js`
- **Problem:** Not imported anywhere. HomepageMasonry also referenced the wrong script.
- **Fix:** Delete both files.

### 6.6 Remove commented-out listener in getrandomimage.js

- **File:** `src/scripts/getrandomimage.js`
- **Problem:** Commented-out `astro:after-swap` listener is dead code.
- **Fix:** Remove the commented line.

### 6.7 Delete unused Social.astro

- **File:** `src/components/Social.astro`
- **Problem:** Not imported anywhere in the codebase.
- **Fix:** Delete the file.

### 6.8 Remove unused `@astrojs/tailwind` dependency

- **File:** `package.json`
- **Problem:** `@astrojs/tailwind` (v3 integration) is listed but Tailwind v4 uses `@tailwindcss/vite`.
- **Fix:** Remove the dependency.

### 6.9 Fix `require()` in tailwind.config.mjs

- **File:** `tailwind.config.mjs:47`
- **Problem:** CJS `require()` in an ESM `.mjs` file.
- **Fix:** Replace with `import typography from "@tailwindcss/typography"`.

### 6.10 Convert sortbydate.jsx to TypeScript

- **File:** `src/components/sortbydate.jsx` -> `src/components/sortbydate.tsx`
- **Problem:** No type annotations; implicit Date coercion.
- **Fix:** Add `ContentEntry` interface, explicit `.getTime()` calls, nullish coalescing.

---

## Phase 7: Deferred / Future Work (not in this PR)

These items are important but too large or risky for this refactor branch. Track as follow-up issues.

- **Convert remaining `src/scripts/*.js` to TypeScript** -- touches every client script, needs testing across all pages.
- **Add Props interfaces** to all Astro components -- large surface area, best done incrementally per component.
- **Deduplicate collection listing pages** (`muses.astro`, `short_form.astro`, etc.) -- requires Astro dynamic routing refactor.
- **Deduplicate theme toggle logic** across `ThemeToggle.astro` and `cv.astro` -- involves the CV page's complex inline script.
- **Refactor `cv.astro`** 426-line monolith -- extract inline scripts to modules.
- **Audit and replace vendored libraries** (glightbox CSS, fslightbox JS) with npm packages.
- **Fix `_tags/` routes** using deprecated `Astro.glob()` -- needs migration to `getCollection()`.
- **Fix empty `src`/`alt` in `getRandomImage.astro` and `Homepage.astro`** -- needs architectural rethink of client-side hydration pattern.

---

## Validation

After all changes, run the full quality gate:

```sh
bun run lint:site
```

This runs `bun run build` + `bun run lint:html` + `bun run lint:links`, which will catch any regressions from the refactor.

---

## Summary

| Phase                   | Items | Risk    | Effort     |
| ----------------------- | ----- | ------- | ---------- |
| 1. Bug Fixes            | 3     | Low     | ~15 min    |
| 2. DRY Schemas & Utils  | 3     | Low-Med | ~30 min    |
| 3. Performance          | 1     | Low     | ~5 min     |
| 4. Dead Code Removal    | 5     | Low     | ~10 min    |
| 5. Consistency & Safety | 4     | Low     | ~15 min    |
| 6. Additional Fixes     | 10    | Low     | ~20 min    |
| 7. Deferred             | 8     | --      | Future PRs |
