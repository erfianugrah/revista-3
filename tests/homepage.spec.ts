import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders and shows random image after JS", async ({ page }) => {
    await page.goto("/");
    const img = page.locator("#randomHomePageImage");
    await expect(img).toBeVisible({ timeout: 5000 });
    const src = await img.getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).not.toBe(
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    );
  });

  test("random image has valid srcset with width descriptors", async ({
    page,
  }) => {
    await page.goto("/");
    const img = page.locator("#randomHomePageImage");
    await expect(img).toBeVisible({ timeout: 5000 });
    const srcset = await img.getAttribute("srcset");
    expect(srcset).toBeTruthy();
    expect(srcset).toMatch(/\d+w/);
    // Should have multiple width descriptors
    const descriptors = srcset!.match(/\d+w/g);
    expect(descriptors!.length).toBeGreaterThanOrEqual(2);
  });

  test("random image has sizes attribute", async ({ page }) => {
    await page.goto("/");
    const img = page.locator("#randomHomePageImage");
    await expect(img).toBeVisible({ timeout: 5000 });
    const sizes = await img.getAttribute("sizes");
    expect(sizes).toBeTruthy();
  });

  test("homepage anchor href is updated from # to real URL", async ({
    page,
  }) => {
    await page.goto("/");
    const img = page.locator("#randomHomePageImage");
    await expect(img).toBeVisible({ timeout: 5000 });
    const anchor = page.locator("#homepage a").first();
    const href = await anchor.getAttribute("href");
    expect(href).not.toBe("#");
    expect(href).toMatch(/^\/(long_form|short_form|muses|zeitweilig)\//);
  });

  test("homepage anchor gets aria-label after JS", async ({ page }) => {
    await page.goto("/");
    const img = page.locator("#randomHomePageImage");
    await expect(img).toBeVisible({ timeout: 5000 });
    const anchor = page.locator("#homepage a").first();
    const label = await anchor.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(label).toMatch(/^View /);
  });

  test("data-images contains valid JSON array with expected shape", async ({
    page,
  }) => {
    await page.goto("/");
    const container = page.locator("#homepage");
    const raw = await container.getAttribute("data-images");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    const first = parsed[0];
    expect(first).toHaveProperty("src");
    expect(first).toHaveProperty("srcset");
    expect(first).toHaveProperty("alt");
    expect(first).toHaveProperty("url");
  });

  test("noscript fallback message exists", async ({ page }) => {
    await page.goto("/");
    const noscript = page.locator("noscript");
    const count = await noscript.count();
    expect(count).toBeGreaterThan(0);
  });
});
