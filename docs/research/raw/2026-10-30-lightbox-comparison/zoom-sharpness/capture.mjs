import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/sbin/chromium" });
async function run(variant) {
  const p = await b.newPage({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2,
  });
  await p.goto("http://localhost:4321/long_form/adam/", {
    waitUntil: "networkidle",
  });
  if (variant === "no-will-change")
    await p.addStyleTag({
      content:
        ".lightbox-overlay.zoomed .lightbox-img, .lightbox-visible .lightbox-img{will-change:auto !important}",
    });
  await p.locator("a.lightbox-link").first().click();
  const img = p.locator(".lightbox-img");
  await img.evaluate((e) => (e.complete ? 0 : e.decode().catch(() => 0)));
  await p.waitForTimeout(700);
  const box = await img.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 10; i++) {
    await p.mouse.wheel(0, -100);
    await p.waitForTimeout(80);
  }
  await p.waitForFunction(
    () => document.querySelector(".lightbox-img").src.endsWith("adam_1.jpg"),
    null,
    { timeout: 20000 },
  );
  await img.evaluate((e) => e.decode().catch(() => 0));
  if (variant === "relayout")
    await img.evaluate((e) => {
      const m = e.style.transform.match(/scale\(([\d.]+)\)/);
      const z = +m[1];
      const w = e.offsetWidth,
        h = e.offsetHeight;
      e.style.transition = "none";
      e.style.maxWidth = "none";
      e.style.maxHeight = "none";
      e.style.width = w * z + "px";
      e.style.height = h * z + "px";
      e.style.transform = "none";
    });
  await p.waitForTimeout(1500);
  const z = await img.evaluate(
    (e) => e.style.transform.slice(0, 20) || "(relayout)",
  );
  const rect = await img.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const shot = await p.screenshot({
    clip: { x: 450, y: 250, width: 300, height: 300 },
  });
  await p.close();
  return { z, shot, rect };
}
import { writeFileSync } from "fs";
const order = ["shipped"];
for (let r = 1; r <= 2; r++)
  for (const v of order) {
    const { z, shot, rect } = await run(v);
    writeFileSync(`/tmp/hyd/sharp-${v}-${r}.png`, shot);
    writeFileSync(`/tmp/hyd/sharp-${v}-${r}.json`, JSON.stringify(rect));
    console.log(r, v, z, JSON.stringify(rect));
  }
await b.close();
