import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const widths = [320, 480, 481, 768, 1440];
const regions = ["header", "#inicio", ".proof-strip", "#perfil", "#artigos", "#newsletter", "footer"];

test.describe("@a11y controlled page", () => {
  for (const width of widths) {
    test(`has no critical or serious axe violations at ${width}px @a11y`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      for (const region of regions) {
        const results = await new AxeBuilder({ page }).include(region).analyze();
        const severe = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
        expect(severe, `${region} at ${width}px`).toEqual([]);
      }
    });
  }

  test("keeps visible controls named and at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const unnamed = await page.locator("a, button").evaluateAll((elements) => elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !(element.textContent || "").trim() && !element.getAttribute("aria-label");
    }).map((element) => element.outerHTML));
    expect(unnamed).toEqual([]);
    const undersized = await page.locator(".button, button, .nav-list a, .footer-links a, .external-link").evaluateAll((elements) => elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    }).map((element) => element.textContent?.trim()));
    expect(undersized).toEqual([]);
  });

  test("exposes a visible focus ring and honors reduced motion", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator("#load-substack").focus();
    const focus = await page.locator("#load-substack").evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineColor: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focus).toEqual({ outlineColor: "rgb(17, 17, 17)", outlineStyle: "solid", outlineWidth: "2px" });
    const motion = await page.evaluate(() => ({
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitions: [...document.querySelectorAll("*")].map((element) => getComputedStyle(element).transitionDuration).filter((duration) => duration !== "0s"),
      animations: [...document.querySelectorAll("*")].map((element) => getComputedStyle(element).animationDuration).filter((duration) => duration !== "0s"),
    }));
    expect(motion.scrollBehavior).toBe("auto");
    expect(motion.transitions).toEqual([]);
    expect(motion.animations).toEqual([]);
  });
});
