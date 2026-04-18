import { test, expect } from "@playwright/test";

test.describe("Meta tags and SEO", () => {
  test("homepage has correct title and meta", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Home/);
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /.+/);
    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute("content", /.+/);
  });

  test("homepage has valid og:image (not empty)", async ({ page }) => {
    // W3: og:image should not be empty string
    await page.goto("/");
    const ogImage = page.locator('meta[property="og:image"]');
    const content = await ogImage.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).not.toBe("");
    expect(content).toMatch(/^https?:\/\//);
  });

  test("blog post has correct meta author (full name, not first name)", async ({
    page,
  }) => {
    // W2: meta author should be full name, not lowercased first name
    await page.goto("/muses/augury/");
    const metaAuthor = page.locator('meta[name="author"]');
    const content = await metaAuthor.getAttribute("content");
    expect(content).toBeTruthy();
    // Should not be just a lowercased first name
    expect(content).not.toMatch(/^[a-z]+$/);
  });

  test("favicon link has correct MIME type matching format", async ({
    page,
  }) => {
    // W4: favicon type should match actual format
    await page.goto("/");
    const faviconLink = page.locator('link[rel="icon"]');
    const type = await faviconLink.getAttribute("type");
    const href = await faviconLink.getAttribute("href");
    // If href ends in .png, type should be image/png (not image/webp)
    if (href?.includes(".png")) {
      expect(type).toBe("image/png");
    } else if (href?.includes(".webp")) {
      expect(type).toBe("image/webp");
    }
  });

  test("JSON-LD structured data is valid JSON", async ({ page }) => {
    await page.goto("/");
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      expect(() => JSON.parse(content!)).not.toThrow();
    }
  });

  test("JSON-LD does not contain unescaped </script>", async ({ page }) => {
    // S1: JSON-LD should not be breakable via content injection
    await page.goto("/muses/augury/");
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      expect(content).not.toContain("</script>");
    }
  });

  test("blog post og:image is not empty when post has image", async ({
    page,
  }) => {
    await page.goto("/muses/augury/");
    const ogImage = page.locator('meta[property="og:image"]');
    const content = await ogImage.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).not.toBe("");
  });

  test("all collection listing pages have meta description", async ({
    page,
  }) => {
    const pages = [
      "/muses/",
      "/long_form/",
      "/short_form/",
      "/zeitweilig/",
      "/authors/",
    ];
    for (const url of pages) {
      await page.goto(url);
      const desc = page.locator('meta[name="description"]');
      const content = await desc.getAttribute("content");
      expect(content, `Missing description on ${url}`).toBeTruthy();
    }
  });

  test("sitemap exists and is valid XML", async ({ request }) => {
    const resp = await request.get("/sitemap-index.xml");
    expect(resp.status()).toBe(200);
    const text = await resp.text();
    expect(text).toContain("<sitemapindex");
  });

  test("robots.txt exists", async ({ request }) => {
    const resp = await request.get("/robots.txt");
    expect(resp.status()).toBe(200);
  });

  test("RSS feeds return valid XML", async ({ request }) => {
    const feeds = [
      "/muses/rss.xml",
      "/long_form/rss.xml",
      "/short_form/rss.xml",
      "/zeitweilig/rss.xml",
      "/authors/rss.xml",
    ];
    for (const feed of feeds) {
      const resp = await request.get(feed);
      expect(resp.status(), `RSS ${feed} missing`).toBe(200);
      const text = await resp.text();
      expect(text, `RSS ${feed} not XML`).toContain("<rss");
    }
  });
});
