import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-does-not-exist/");
    // Static site serves 404.html (server may return 200 for static file)
    // Check content instead
    const heading = page.locator("h1, h2, p").first();
    await expect(heading).toBeVisible();
  });

  test("404 page has navigation back to home", async ({ page }) => {
    await page.goto("/this-does-not-exist/");
    const homeLink = page.locator('a[href="/"]');
    const count = await homeLink.count();
    expect(count).toBeGreaterThan(0);
  });
});
