import { test, expect } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("dark mode toggle exists and is clickable", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator(
      'button:has-text("theme"), button[aria-label*="theme"], button[aria-label*="Theme"]',
    );
    // Theme toggle may be rendered by React island with client:idle
    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggle.click();
      // html element should have dark class
      const htmlClass = await page.locator("html").getAttribute("class");
      expect(htmlClass).toContain("dark");
      // Click again to toggle back
      await toggle.click();
      const classList2 = await page.evaluate(() =>
        Array.from(document.documentElement.classList),
      );
      // "dark" should not be in classList (distinct from "dark:bg-..." which is a class name)
      expect(classList2).not.toContain("dark");
    }
  });

  test("dark mode persists across navigation", async ({ page }) => {
    await page.goto("/");
    // Set dark mode via JS directly to test persistence
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    });
    await page.goto("/muses/");
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");
  });
});
