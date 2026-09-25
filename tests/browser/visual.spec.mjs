import { expect, test } from "@playwright/test";

test.describe("approved visual contract", () => {
  for (const width of [320, 768, 1440]) {
    test(`matches the structural visual contract at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      await expect(page.locator("body")).toHaveCSS("background-color", "rgb(247, 247, 245)");
      await expect(page.locator("h1")).toHaveCSS("font-family", /Space Grotesk/);
      await expect(page.locator(".hero .button--primary")).toHaveCSS("background-color", "rgb(255, 106, 0)");
      await expect(page.locator(".newsletter-panel")).toHaveCSS("background-color", "rgb(17, 17, 17)");
      const screenshotName = `test-results/visual-${width}.png`;
      await page.screenshot({ path: screenshotName, fullPage: true });
    });
  }
});
