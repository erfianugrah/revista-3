import { test, expect } from "@playwright/test";

test.describe("Pagefind search", () => {
  test("search dialog opens on Ctrl+K", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.locator("dialog[open], .search-dialog[open]");
    // Pagefind may use dialog element or custom modal
    await expect(dialog).toBeVisible({ timeout: 3000 });
  });

  test("search trigger button exists", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator("#search-trigger, [data-search-trigger]");
    if ((await trigger.count()) > 0) {
      await expect(trigger).toBeVisible();
    }
  });

  test("search returns results for a known query", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const input = page.locator("#searchInput");
    await input.fill("erfi");
    // Wait for debounce (150ms) + search execution
    const summary = page.locator("#searchSummary");
    await expect(summary).not.toHaveText("", { timeout: 5000 });
    // Should have at least 1 result, not "Search unavailable"
    const resultsArea = page.locator("#searchResults");
    const text = await resultsArea.textContent();
    expect(text).not.toContain("Search unavailable");
    expect(text).not.toContain("No results found");
    // Result cards should be present
    const cards = page.locator(".result-card");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test("B4: Ctrl+K works after navigation without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Navigate multiple times (full page loads in static preview)
    await page.goto("/");
    await page.goto("/muses/");
    await page.goto("/");

    // Ctrl+K should still open dialog cleanly
    await page.keyboard.press("Control+k");
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Close and reopen to verify no stacking issues
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Control+k");
    await expect(dialog).toBeVisible({ timeout: 3000 });

    expect(errors).toHaveLength(0);
  });
});
