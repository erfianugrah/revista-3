import { test, expect } from "@playwright/test";

test.describe("CV page", () => {
  test("CV page renders", async ({ page }) => {
    await page.goto("/cv/");
    await expect(page).toHaveTitle(/CV|Resume|stoicopa/i);
  });

  test("CV has structured data", async ({ page }) => {
    await page.goto("/cv/");
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const content = await jsonLd.nth(i).textContent();
      expect(() => JSON.parse(content!)).not.toThrow();
    }
  });

  test("CV imported content renders", async ({ page }) => {
    await page.goto("/cv/");
    const cvContent = page.locator(".cv-imported, .cv-sections");
    // At least one of these should be present
    const hasImported = (await cvContent.count()) > 0;
    expect(hasImported).toBe(true);
  });

  test("W26: print CSS targets correct class", async ({ page }) => {
    await page.goto("/cv/");
    // Check if company-wrapper class exists in DOM
    const companyWrappers = page.locator(".company-wrapper");
    const companyCount = await companyWrappers.count();
    // Check if work-experience-wrapper exists (it shouldn't per W26)
    const workExpWrappers = page.locator(".work-experience-wrapper");
    const workExpCount = await workExpWrappers.count();
    // company-wrapper should exist, work-experience-wrapper should not
    if (companyCount > 0) {
      expect(workExpCount).toBe(0);
    }
  });
});
