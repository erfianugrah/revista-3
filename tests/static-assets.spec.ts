import { test, expect } from "@playwright/test";

test.describe("Static assets and build output", () => {
  test("favicon.svg exists", async ({ request }) => {
    const resp = await request.get("/favicon.svg");
    expect(resp.status()).toBe(200);
  });

  test("pagefind assets exist", async ({ request }) => {
    const resp = await request.get("/pagefind/pagefind.js");
    expect(resp.status()).toBe(200);
  });

  test("CSS bundle loads", async ({ page }) => {
    await page.goto("/");
    const styles = page.locator('link[rel="stylesheet"]');
    const count = await styles.count();
    expect(count).toBeGreaterThan(0);
  });

  test("JS bundles load without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await page.waitForTimeout(2000);
    expect(errors, `JS errors: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("no JS errors on blog post page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/muses/augury/");
    await page.waitForTimeout(2000);
    expect(errors, `JS errors: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("no JS errors on tag page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/muses/tags/");
    await page.waitForTimeout(2000);
    expect(errors, `JS errors: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("no JS errors on CV page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/cv/");
    await page.waitForTimeout(2000);
    expect(errors, `JS errors: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("optimized images are served as AVIF", async ({ page }) => {
    await page.goto("/muses/");
    const images = page.locator('img[src*="/_astro/"]');
    const count = await images.count();
    if (count > 0) {
      const src = await images.first().getAttribute("src");
      expect(src).toMatch(/\.avif$/);
    }
  });

  test("no broken internal links on homepage", async ({ page }) => {
    await page.goto("/");
    const links = page.locator("a[href^='/']");
    const count = await links.count();
    const broken: string[] = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href !== "#") {
        const resp = await page.request.get(href);
        if (resp.status() >= 400) {
          broken.push(`${href} → ${resp.status()}`);
        }
      }
    }
    expect(broken, `Broken links: ${broken.join(", ")}`).toHaveLength(0);
  });
});
