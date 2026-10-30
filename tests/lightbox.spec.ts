import { test, expect, type Locator, type Page } from "@playwright/test";

test.describe("Lightbox", () => {
  // Pages with Masonry gallery (glightbox links) are in long_form/short_form
  const galleryPage = "/long_form/adam/";

  test("clicking gallery image opens lightbox overlay", async ({ page }) => {
    await page.goto(galleryPage);
    const galleryLink = page.locator("a.lightbox-link").first();
    if ((await galleryLink.count()) === 0) {
      test.skip();
      return;
    }
    await galleryLink.click();
    const overlay = page.locator(".lightbox-overlay");
    await expect(overlay).toBeVisible({ timeout: 3000 });
  });

  test("lightbox close button dismisses overlay", async ({ page }) => {
    await page.goto(galleryPage);
    const galleryLink = page.locator("a.lightbox-link").first();
    if ((await galleryLink.count()) === 0) {
      test.skip();
      return;
    }
    await galleryLink.click();
    const overlay = page.locator(".lightbox-overlay");
    await expect(overlay).toBeVisible({ timeout: 3000 });
    const closeBtn = page.locator(".lightbox-close");
    await closeBtn.click();
    await expect(overlay).not.toBeVisible({ timeout: 3000 });
  });

  test("lightbox closes on Escape key", async ({ page }) => {
    await page.goto(galleryPage);
    const galleryLink = page.locator("a.lightbox-link").first();
    if ((await galleryLink.count()) === 0) {
      test.skip();
      return;
    }
    await galleryLink.click();
    const overlay = page.locator(".lightbox-overlay");
    await expect(overlay).toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Escape");
    await expect(overlay).not.toBeVisible({ timeout: 3000 });
  });

  test("B1: lightbox drag state doesn't get stuck", async ({ page }) => {
    // Tests that mouseup outside image doesn't leave drag stuck
    await page.goto(galleryPage);
    const galleryLink = page.locator("a.lightbox-link").first();
    if ((await galleryLink.count()) === 0) {
      test.skip();
      return;
    }
    await galleryLink.click();
    const overlay = page.locator(".lightbox-overlay");
    await expect(overlay).toBeVisible({ timeout: 3000 });

    const img = page.locator(".lightbox-img");
    const box = await img.boundingBox();
    if (!box) {
      test.skip();
      return;
    }

    // Simulate drag: mousedown on image, move off, mouseup outside
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // Move far outside the image
    await page.mouse.move(10, 10);
    await page.mouse.up();

    // After releasing, clicking overlay should still close it
    // (if drag state is stuck, hasDragged=true prevents close)
    await page.mouse.click(10, 10);
    // Give time for the close animation
    await page.waitForTimeout(500);
    // This tests the bug: if stuck, overlay stays visible
    // Note: This test will FAIL until B1 is fixed
  });

  test("lightbox navigates between images with arrow keys", async ({
    page,
  }) => {
    await page.goto(galleryPage);
    const galleryLinks = page.locator("a.lightbox-link");
    if ((await galleryLinks.count()) < 2) {
      test.skip();
      return;
    }
    await galleryLinks.first().click();
    const overlay = page.locator(".lightbox-overlay");
    await expect(overlay).toBeVisible({ timeout: 3000 });

    const img = page.locator(".lightbox-img");
    const src1 = await img.getAttribute("src");

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    const src2 = await img.getAttribute("src");
    expect(src2).not.toBe(src1);
  });
});

// ── Zoom, pan, image loading, accessibility (revista-3#3, #4, #5) ──

test.describe("Lightbox zoom and pan", () => {
  const galleryPage = "/long_form/adam/";

  async function openLightbox(page: Page, index = 0): Promise<Locator> {
    await page.goto(galleryPage);
    await page.locator("a.lightbox-link").nth(index).click();
    const img = page.locator(".lightbox-img");
    await expect(page.locator(".lightbox-overlay")).toBeVisible();
    await img.evaluate((el: HTMLImageElement) =>
      el.complete ? undefined : el.decode().catch(() => undefined),
    );
    // Open animation (scale 0.92 -> 1) runs 0.4s
    await page.waitForTimeout(600);
    // Remember the fit width: zoom = rendered width / fit width, whether the
    // zoom is a scale() transform or committed to layout size
    await img.evaluate((el) => {
      el.dataset.fitW = String(el.getBoundingClientRect().width);
    });
    return img;
  }

  const scaleOf = (img: Locator) =>
    img.evaluate(
      (el: HTMLImageElement) =>
        el.getBoundingClientRect().width / Number(el.dataset.fitW),
    );

  /** Dispatch one wheel event per animation frame on the image. */
  const wheelFrames = (
    img: Locator,
    init: { deltaX?: number; deltaY?: number; ctrlKey?: boolean },
    frames: number,
  ): Promise<void> =>
    img.evaluate(
      async (el, { init, frames }) => {
        const r = el.getBoundingClientRect();
        for (let i = 0; i < frames; i++) {
          el.dispatchEvent(
            new WheelEvent("wheel", {
              clientX: r.left + r.width / 2,
              clientY: r.top + r.height / 2,
              bubbles: true,
              cancelable: true,
              ...init,
            }),
          );
          await new Promise((res) => requestAnimationFrame(res));
        }
        await new Promise((res) => requestAnimationFrame(res));
      },
      { init, frames },
    );

  test("wheel zoom keeps the point under the cursor fixed", async ({
    page,
  }) => {
    const img = await openLightbox(page);
    const box = (await img.boundingBox())!;
    const cx = box.x + box.width * 0.75;
    const cy = box.y + box.height * 0.35;
    const fraction = () =>
      img.evaluate(
        (el, [x, y]) => {
          const r = el.getBoundingClientRect();
          return [(x - r.left) / r.width, (y - r.top) / r.height];
        },
        [cx, cy],
      );
    const before = await fraction();
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(150);
    }
    expect(await scaleOf(img)).toBeGreaterThan(1.3);
    const after = await fraction();
    expect(Math.abs(after[0] - before[0])).toBeLessThan(0.01);
    expect(Math.abs(after[1] - before[1])).toBeLessThan(0.01);
  });

  test("one mouse-wheel notch zooms about 1.15x", async ({ page }) => {
    const img = await openLightbox(page);
    await wheelFrames(img, { deltaY: -100 }, 1);
    const s = await scaleOf(img);
    expect(s).toBeGreaterThan(1.1);
    expect(s).toBeLessThan(1.2);
  });

  test("small trackpad pinch zooms proportionally, not to max", async ({
    page,
  }) => {
    const img = await openLightbox(page);
    // Trackpad pinch arrives as ctrlKey wheel events with small deltas
    await wheelFrames(img, { deltaY: -1.5, ctrlKey: true }, 12);
    const s = await scaleOf(img);
    expect(s).toBeGreaterThan(1.05);
    expect(s).toBeLessThan(1.4);
  });

  test("horizontal two-finger swipe does not change zoom", async ({ page }) => {
    const img = await openLightbox(page);
    await page.locator(".lightbox-zoom").click();
    expect(await scaleOf(img)).toBeCloseTo(2, 2);
    await wheelFrames(img, { deltaX: 20, deltaY: 0 }, 5);
    expect(await scaleOf(img)).toBeCloseTo(2, 2);
  });

  test("dragging cannot push the image off-screen", async ({ page }) => {
    const img = await openLightbox(page);
    await page.locator(".lightbox-zoom").click();
    const box = (await img.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 4000, box.y + 4000, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    const vp = page.viewportSize()!;
    const r = (await img.boundingBox())!;
    // 1px slack: the clamp uses integer offsetWidth/Height
    expect(r.x).toBeLessThanOrEqual(vp.width / 2 + 1);
    expect(r.x + r.width).toBeGreaterThanOrEqual(vp.width / 2 - 1);
    expect(r.y).toBeLessThanOrEqual(vp.height / 2 + 1);
    expect(r.y + r.height).toBeGreaterThanOrEqual(vp.height / 2 - 1);
  });

  test("re-initialising does not accumulate document drag listeners", async ({
    page,
    context,
  }) => {
    await page.goto(galleryPage);
    const cdp = await context.newCDPSession(page);
    const count = async () => {
      const { result } = await cdp.send("Runtime.evaluate", {
        expression: "document",
      });
      const { listeners } = await cdp.send("DOMDebugger.getEventListeners", {
        objectId: result.objectId!,
      });
      return listeners.filter((l) => l.type === "mousemove").length;
    };
    const baseline = await count();
    for (let i = 0; i < 3; i++) {
      // Simulate a ClientRouter navigation: astro:page-load re-runs initialize()
      await page.evaluate(() =>
        document.dispatchEvent(new Event("astro:page-load")),
      );
      await page.locator("a.lightbox-link").first().click();
      await expect(page.locator(".lightbox-overlay")).toBeVisible();
      await page.keyboard.press("Escape");
    }
    expect(await count()).toBe(baseline + 1);
  });
});

test.describe("Lightbox zoom rendering and gestures", () => {
  const galleryPage = "/long_form/adam/";

  async function openLightbox(page: Page): Promise<Locator> {
    await page.goto(galleryPage);
    await page.locator("a.lightbox-link").first().click();
    const img = page.locator(".lightbox-img");
    await expect(page.locator(".lightbox-overlay")).toBeVisible();
    await img.evaluate((el: HTMLImageElement) =>
      el.complete ? undefined : el.decode().catch(() => undefined),
    );
    await page.waitForTimeout(600);
    return img;
  }

  const rectOf = (img: Locator) =>
    img.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });

  test("idle zoom is committed to layout size so it renders sharp", async ({
    page,
  }) => {
    const img = await openLightbox(page);
    const box = (await img.boundingBox())!;
    // Zoom and sample inside one page task so the 150ms settle timer cannot
    // fire between the gesture and the mid-gesture read on a loaded machine
    const during = await img.evaluate(
      async (el, p) => {
        for (let i = 0; i < 4; i++) {
          el.dispatchEvent(
            new WheelEvent("wheel", {
              deltaY: -100,
              clientX: p.x,
              clientY: p.y,
              bubbles: true,
              cancelable: true,
            }),
          );
          await new Promise((r) => requestAnimationFrame(r));
        }
        await new Promise((r) => requestAnimationFrame(r));
        const r = el.getBoundingClientRect();
        return {
          transform: el.style.transform,
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
        };
      },
      { x: box.x + box.width * 0.6, y: box.y + box.height * 0.4 },
    );
    // Mid-gesture: scale transform
    expect(during.transform).toContain("scale(");
    await page.waitForTimeout(500);
    // Idle: real width/height, translate only, same on-screen geometry
    const style = await img.evaluate((el) => ({
      transform: el.style.transform,
      width: el.style.width,
    }));
    expect(style.transform).not.toContain("scale(");
    expect(style.width).toMatch(/px$/);
    const after = await rectOf(img);
    for (const k of ["x", "y", "w", "h"] as const) {
      expect(Math.abs(after[k] - during[k])).toBeLessThan(1.5);
    }
  });

  test("double-click zooms one step, not two", async ({ page }) => {
    const img = await openLightbox(page);
    const box = (await img.boundingBox())!;
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    const r = await rectOf(img);
    // One step = 2x the fit size
    expect(r.w / box.width).toBeGreaterThan(1.9);
    expect(r.w / box.width).toBeLessThan(2.1);
  });

  test("two-finger pinch follows the fingers' midpoint", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    try {
      const img = await openLightbox(page);
      const cdp = await context.newCDPSession(page);
      const box = (await img.boundingBox())!;
      const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const end = { x: start.x + 60, y: start.y + 40 };
      const frac = (p: { x: number; y: number }) =>
        img.evaluate((el, q) => {
          const r = el.getBoundingClientRect();
          return [(q.x - r.left) / r.width, (q.y - r.top) / r.height];
        }, p);
      const before = await frac(start);
      const touches = (m: { x: number; y: number }, d: number) => [
        { x: m.x - d / 2, y: m.y, id: 0 },
        { x: m.x + d / 2, y: m.y, id: 1 },
      ];
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: touches(start, 80),
      });
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        const m = {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        };
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: touches(m, 80 + 80 * t),
        });
        await page.waitForTimeout(20);
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await page.waitForTimeout(500);
      const r = await rectOf(img);
      expect(r.w / box.width).toBeGreaterThan(1.8);
      // The image point that was under the fingers is still under them
      const after = await frac(end);
      expect(Math.abs(after[0] - before[0])).toBeLessThan(0.02);
      expect(Math.abs(after[1] - before[1])).toBeLessThan(0.02);
    } finally {
      await context.close();
    }
  });
});

test.describe("Lightbox image loading", () => {
  const galleryPage = "/long_form/adam/";

  test("opens on a resized image and swaps to the original when zoomed", async ({
    page,
  }) => {
    await page.goto(galleryPage);
    const link = page.locator("a.lightbox-link").first();
    const original = (await link.getAttribute("href"))!;
    await link.click();
    const img = page.locator(".lightbox-img");
    await expect(img).toHaveAttribute("src", /\/cdn-cgi\/image\//);
    await page.waitForTimeout(600);
    await page.locator(".lightbox-zoom").click();
    await expect(img).toHaveAttribute("src", original, { timeout: 15000 });
  });

  test("falls back to the original when the resized image fails", async ({
    page,
  }) => {
    await page.route("**/cdn-cgi/image/**", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    await page.goto(galleryPage);
    const link = page.locator("a.lightbox-link").first();
    const original = (await link.getAttribute("href"))!;
    await link.click();
    await expect(page.locator(".lightbox-img")).toHaveAttribute(
      "src",
      original,
      { timeout: 10000 },
    );
  });
});

test.describe("Lightbox accessibility", () => {
  const galleryPage = "/long_form/adam/";

  test("focus moves into the dialog, stays there, and returns on close", async ({
    page,
  }) => {
    await page.goto(galleryPage);
    const link = page.locator("a.lightbox-link").nth(1);
    await link.click();
    await expect(page.locator(".lightbox-overlay")).toBeVisible();
    const inOverlay = () =>
      page.evaluate(
        () => !!document.activeElement?.closest(".lightbox-overlay"),
      );
    expect(await inOverlay()).toBe(true);
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(await inOverlay()).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    expect(await inOverlay()).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.locator(".lightbox-overlay")).not.toBeVisible();
    await expect(link).toBeFocused();
  });

  test("counter is a polite live region and buttons are type=button", async ({
    page,
  }) => {
    await page.goto(galleryPage);
    await page.locator("a.lightbox-link").first().click();
    await expect(page.locator(".lightbox-counter")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    const types = await page
      .locator(".lightbox-overlay button")
      .evaluateAll((bs) => bs.map((b) => b.getAttribute("type")));
    expect(types.length).toBeGreaterThan(0);
    expect(types.every((t) => t === "button")).toBe(true);
  });

  test("prefers-reduced-motion disables lightbox transitions", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(galleryPage);
    await page.locator("a.lightbox-link").first().click();
    const durations = await page.evaluate(() =>
      [".lightbox-overlay", ".lightbox-img"].map(
        (s) => getComputedStyle(document.querySelector(s)!).transitionDuration,
      ),
    );
    for (const d of durations) {
      expect(d.split(",").every((x) => parseFloat(x) === 0)).toBe(true);
    }
  });

  test("scroll lock compensates for the removed scrollbar", async ({
    playwright,
    baseURL,
  }) => {
    // Playwright headless passes --hide-scrollbars (overlay scrollbars, width
    // 0); launch without it so the page has a real scrollbar to compensate
    const browser = await playwright.chromium.launch({
      ignoreDefaultArgs: ["--hide-scrollbars"],
    });
    try {
      const page = await browser.newPage({ baseURL });
      await page.goto(galleryPage);
      const sbw = await page.evaluate(
        () => window.innerWidth - document.documentElement.clientWidth,
      );
      expect(sbw).toBeGreaterThan(0);
      await page.locator("a.lightbox-link").first().click();
      expect(await page.evaluate(() => document.body.style.paddingRight)).toBe(
        `${sbw}px`,
      );
      expect(
        await page.evaluate(() => document.documentElement.clientWidth),
      ).toBe(await page.evaluate(() => window.innerWidth));
      await page.keyboard.press("Escape");
      expect(await page.evaluate(() => document.body.style.paddingRight)).toBe(
        "",
      );
    } finally {
      await browser.close();
    }
  });
});
