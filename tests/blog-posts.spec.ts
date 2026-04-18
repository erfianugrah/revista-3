import { test, expect } from "@playwright/test";

test.describe("Blog post pages", () => {
  test("post with image renders hero", async ({ page }) => {
    await page.goto("/muses/augury/");
    // HeroImage or a background image container should be present
    const hero = page.locator("[data-pagefind-body]").first();
    await expect(hero).toBeVisible();
  });

  test("post page has article content", async ({ page }) => {
    await page.goto("/muses/augury/");
    const prose = page.locator(".prose, [data-pagefind-body]").first();
    await expect(prose).toBeVisible();
  });

  test("post page has author link", async ({ page }) => {
    await page.goto("/muses/augury/");
    const authorLink = page.locator('a[href*="/authors/"]');
    await expect(authorLink).toBeVisible();
  });

  test("post page has published date", async ({ page }) => {
    await page.goto("/muses/augury/");
    const dateText = page.getByText(/Published:/);
    await expect(dateText).toBeVisible();
  });

  test("NextPost section renders cards", async ({ page }) => {
    await page.goto("/muses/augury/");
    const container = page.locator("#randomPosts");
    await expect(container).toBeVisible();
    // Wait for JS to populate
    const visibleCards = page.locator(".post-item[style*='display: block']");
    await expect(visibleCards.first()).toBeVisible({ timeout: 5000 });
  });

  test("NextPost cards have non-empty src (not empty string)", async ({
    page,
  }) => {
    // W7: img src="" causes browser to request current page
    await page.goto("/muses/augury/");
    const visibleCards = page.locator(".post-item[style*='display: block']");
    await expect(visibleCards.first()).toBeVisible({ timeout: 5000 });
    const imgs = visibleCards.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const src = await imgs.nth(i).getAttribute("src");
      expect(src, `NextPost card ${i} has empty src`).not.toBe("");
    }
  });

  test("NextPost cards link to valid post URLs", async ({ page }) => {
    await page.goto("/muses/augury/");
    const visibleCards = page.locator(".post-item[style*='display: block']");
    await expect(visibleCards.first()).toBeVisible({ timeout: 5000 });
    const count = await visibleCards.count();
    for (let i = 0; i < count; i++) {
      const href = await visibleCards.nth(i).getAttribute("href");
      expect(href).not.toBe("#");
      expect(href).toMatch(/^\/muses\/.+\/$/);
    }
  });

  test("collection listing page renders blog posts", async ({ page }) => {
    await page.goto("/muses/");
    const articles = page.locator("article");
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });

  test("long_form listing page renders", async ({ page }) => {
    await page.goto("/long_form/");
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible();
  });
});
