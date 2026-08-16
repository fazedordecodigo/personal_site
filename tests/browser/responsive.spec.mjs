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
    const controls = page.locator(".button, button, .nav-list a, .footer-links a, .external-link");
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
  expect(await page.locator(".article-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(1);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.locator(".hero").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(2);
  expect(await page.locator(".article-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(3);
});

test("aligns all article cards below the update metadata on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const layout = await page.locator(".article-grid").evaluate((grid) => {
    const metadata = grid.querySelector(".article-meta");
    const cards = [...grid.querySelectorAll(".article-card")];

    return {
      metadataBottom: metadata.getBoundingClientRect().bottom,
      cardTops: cards.map((card) => card.getBoundingClientRect().top),
    };
  });

  expect(layout.cardTops).toHaveLength(3);
  expect(layout.cardTops.every((top) => Math.abs(top - layout.cardTops[0]) < 1)).toBe(true);
  expect(layout.cardTops[0]).toBeGreaterThan(layout.metadataBottom);
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
