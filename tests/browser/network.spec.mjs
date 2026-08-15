import { expect, test } from "@playwright/test";

const SUBSTACK_ORIGIN = "https://fazedordecodigo.substack.com";
const EMBED_URL = `${SUBSTACK_ORIGIN}/embed`;
const TIMEOUT_TEXT = "Não foi possível confirmar o carregamento do formulário. Use Assinar no Substack.";

test.describe("network and third-party boundary", () => {
  for (const width of [320, 480, 481, 1440]) {
    test(`does not contact third parties before activation at ${width}px`, async ({ page }) => {
      const thirdPartyRequests = [];
      page.on("request", (request) => {
        if (request.url().startsWith(SUBSTACK_ORIGIN)) thirdPartyRequests.push(request.url());
      });
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      await page.waitForTimeout(100);
      expect(thirdPartyRequests).toEqual([]);
    });
  }

  test("separates the single parent embed navigation from iframe subrequests", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const parentEmbedRequests = [];
    const frameSubrequests = [];
    page.on("request", (request) => {
      if (!request.url().startsWith(SUBSTACK_ORIGIN)) return;
      if (request.url() === EMBED_URL) parentEmbedRequests.push(request.url());
      else frameSubrequests.push(request.url());
    });
    await page.route(`${SUBSTACK_ORIGIN}/**`, (route) => {
      if (route.request().url() === EMBED_URL) {
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `<!doctype html><html><body><img src="${SUBSTACK_ORIGIN}/internal.png" alt=""></body></html>`,
        });
      }
      return route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("png") });
    });
    await page.goto("/");
    await page.locator("#load-substack").click();
    await expect(page.locator("#iframe-status")).toContainText("navegação do iframe");
    await expect.poll(() => parentEmbedRequests.length).toBe(1);
    await expect.poll(() => frameSubrequests.length).toBe(1);
    expect(parentEmbedRequests).toEqual([EMBED_URL]);
    expect(frameSubrequests[0]).toBe(`${SUBSTACK_ORIGIN}/internal.png`);
  });

  test("keeps the external fallback usable when the iframe stays blocked", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.clock.install();
    await page.route("http://127.0.0.1:4173/", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      await route.fulfill({ response, body: body.replace('data-timeout-ms="12000"', 'data-timeout-ms="25"') });
    });
    await page.route(EMBED_URL, () => new Promise(() => {}));
    await page.goto("/");
    await page.locator("#load-substack").click();
    await page.clock.runFor(26);
    await expect(page.locator("#iframe-status")).toHaveText(TIMEOUT_TEXT);
    await expect(page.locator(".external-link")).toBeVisible();
    await expect(page.locator(".external-link")).toHaveClass(/is-highlighted/);
  });
});
