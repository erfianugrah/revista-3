import { test, expect } from "@playwright/test";

test.describe("Tag pages", () => {
  test("muses tags page renders random images", async ({ page }) => {
    await page.goto("/muses/tags/");
    const images = page.locator(".randomimage img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    // Wait for JS to show at least one
    await expect(images.first()).toBeVisible({ timeout: 5000 });
  });

  test("tag random images have valid srcset", async ({ page }) => {
    await page.goto("/muses/tags/");
    const img = page.locator(".randomimage img").first();
    await expect(img).toBeVisible({ timeout: 5000 });
    const srcset = await img.getAttribute("srcset");
    expect(srcset).toBeTruthy();
    expect(srcset).toMatch(/\d+w/);
  });

  test("tag random images have correct sizes for grid layout", async ({
    page,
  }) => {
    await page.goto("/muses/tags/");
    const img = page.locator(".randomimage img").first();
    const sizes = await img.getAttribute("sizes");
    expect(sizes).toBeTruthy();
    // Should reference the custom sm breakpoint (800px)
    expect(sizes).toContain("800px");
  });

  test("tag links point to valid tag URLs", async ({ page }) => {
    await page.goto("/muses/tags/");
    const links = page.locator(".randomimage a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toMatch(/^\/muses\/tags\//);
    }
  });

  test("tag page with posts lists blog entries", async ({ page }) => {
    await page.goto("/muses/tags/muses/");
    const articles = page.locator("article");
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });

  test("long_form tags page renders", async ({ page }) => {
    await page.goto("/long_form/tags/");
    await expect(page.locator(".randomimage")).toHaveCount(1);
  });

  test("data-images on tag page contains valid JSON", async ({ page }) => {
    await page.goto("/muses/tags/");
    const container = page.locator(".randomimage").first();
    const raw = await container.getAttribute("data-images");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty("src");
    expect(parsed[0]).toHaveProperty("srcset");
    expect(parsed[0]).toHaveProperty("alt");
  });
});
