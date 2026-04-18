import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("header nav links are present", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
    // Check key nav links exist
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();
  });

  test("nav links navigate to correct pages", async ({ page }) => {
    // Open hamburger menu on mobile to expose nav links
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const hamburger = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"]',
    );
    if (await hamburger.isVisible()) {
      await hamburger.click();
      const musesLink = page.locator('#nav-links a[href="/muses/"]');
      await expect(musesLink).toBeVisible({ timeout: 3000 });
      await musesLink.click();
      await expect(page).toHaveURL(/\/muses/);
    }
  });

  test("hamburger menu toggles on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const hamburger = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"]',
    );
    if (await hamburger.isVisible()) {
      await hamburger.click();
      // Nav links should become visible
      const navLinks = page.locator("#nav-links");
      await expect(navLinks).toBeVisible({ timeout: 3000 });
    }
  });

  test("W22: menu role without keyboard nav (ARIA audit)", async ({ page }) => {
    await page.goto("/");
    const menuElement = page.locator('[role="menu"]');
    const count = await menuElement.count();
    if (count > 0) {
      // If role=menu exists, menuitem children should also exist
      const menuItems = page.locator('[role="menuitem"]');
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThan(0);
      // Note: This test documents the ARIA misuse. A fix would either
      // add keyboard nav or remove the roles.
    }
  });

  test("footer renders with social links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    // Social links should have rel="noopener noreferrer"
    const externalLinks = footer.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute("rel");
      const href = await externalLinks.nth(i).getAttribute("href");
      // External links should have rel="noopener noreferrer"
      if (rel !== null) {
        expect(rel, `External link ${href} missing noopener`).toContain(
          "noopener",
        );
      } else {
        // Flag as issue — external links without rel
        expect
          .soft(rel, `External link ${href} has no rel attribute`)
          .toBeTruthy();
      }
    }
  });

  test("W31: footer RSS link href is not empty after JS", async ({ page }) => {
    await page.goto("/muses/");
    await page.waitForTimeout(1000); // wait for rss.ts to run
    const rssLink = page.locator("#rss-link");
    if ((await rssLink.count()) > 0) {
      const href = await rssLink.getAttribute("href");
      // After JS runs, href should be populated (not empty)
      if (href !== null) {
        expect(href).not.toBe("");
      }
    }
  });
});
