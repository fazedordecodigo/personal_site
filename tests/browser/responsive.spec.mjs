import { expect, test } from "@playwright/test";

const widths = [320, 480, 481, 768, 1440];

for (const width of widths) {
  test(`keeps the page usable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("nav[aria-label='Navegação principal']")).toBeVisible();
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    const controls = page.locator(".button, button, .nav-list a, .footer-links a, .external-link, .talk-item .text-link, .spotlight-card .text-link, .profile-card__link, .luma-wrap + .text-link, .article-panel + .text-link");
    const count = await controls.count();
    for (let index = 0; index < count; index += 1) {
      const box = await controls.nth(index).boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    const portrait = await page.locator(".portrait-card img").boundingBox();
    expect(portrait?.width ?? 0).toBeLessThanOrEqual(400);
    expect(portrait?.height ?? 0).toBeLessThanOrEqual(400);
  });
}

test("stacks the approved regions at tablet and mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  expect(await page.locator(".hero").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(1);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.locator(".hero").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(2);
});

test("keeps article rows below the update metadata on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const layout = await page.locator(".article-list").evaluate((list) => {
    const metadata = list.querySelector(".article-meta");
    const rows = [...list.querySelectorAll(".article-row")];

    return {
      metadataBottom: metadata.getBoundingClientRect().bottom,
      rowTops: rows.map((row) => row.getBoundingClientRect().top),
    };
  });

  expect(layout.rowTops).toHaveLength(3);
  expect(layout.rowTops[0]).toBeGreaterThan(layout.metadataBottom);
  expect(layout.rowTops[1]).toBeGreaterThan(layout.rowTops[0]);
  expect(layout.rowTops[2]).toBeGreaterThan(layout.rowTops[1]);
});

test("reflows at a narrow 160 CSS pixel viewport without clipped content", async ({ page }) => {
  await page.setViewportSize({ width: 160, height: 1200 });
  await page.goto("/");
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("nav[aria-label='Navegação principal']")).toBeVisible();
});
