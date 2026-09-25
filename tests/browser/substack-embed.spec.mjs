import { expect, test } from "@playwright/test";

const EMBED_URL = "https://fazedordecodigo.substack.com/embed";
const LOADING_TEXT = "Solicitação enviada ao Substack. Se a área abaixo não funcionar, use Assinar no Substack.";
const LOADED_TEXT = "O navegador concluiu a navegação do iframe, mas esta página não consegue confirmar o conteúdo interno nem a inscrição.";
const TIMEOUT_TEXT = "Não foi possível confirmar o carregamento do formulário. Use Assinar no Substack.";
const MOBILE_TEXT = "Formulário não oferecido nesta largura. Use o link Assinar no Substack.";

function trackEmbedRequests(page) {
  const requests = [];
  page.on("request", (request) => {
    if (request.url() === EMBED_URL) requests.push(request);
  });
  return requests;
}

async function assertInitialBoundary(page, width) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/?probe=1");
  await expect(page.locator('script[src="/js/substack-embed.js"][defer]')).toHaveCount(1);
  await expect(page.locator("#substack-frame")).toHaveAttribute("data-src", EMBED_URL);
  expect(await page.locator("#substack-frame").getAttribute("src")).toBeNull();
}

async function fulfillWithHtml(page) {
  await page.route(EMBED_URL, (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><body><p>Deterministic test document.</p></body></html>",
  }));
}

async function holdEmbedRequest(page) {
  let release;
  await page.route(EMBED_URL, (route) => new Promise((resolve) => {
    release = async () => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><html><body><p>Deterministic test document.</p></body></html>",
      });
      resolve();
    };
  }));
  return () => release?.();
}

async function replaceServedTimeout(page, replacement) {
  await page.route("http://127.0.0.1:4173/", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    await route.fulfill({
      response,
      body: replacement(body),
    });
  });
}

test.describe("Substack click-to-load boundary", () => {
  for (const width of [1440, 481]) {
    test(`does not request Substack before activation at ${width}px`, async ({ page }) => {
      const requests = trackEmbedRequests(page);
      await assertInitialBoundary(page, width);
      await page.mouse.wheel(0, 800);
      await page.locator('a[href="#quem-e"]').hover();
      await page.locator('a[href="#quem-e"]').focus();
      await page.keyboard.press("Tab");
      await page.locator('a[href="#artigos"]').focus();
      await page.keyboard.press("Enter");
      expect(requests).toHaveLength(0);
      expect(await page.locator("#substack-frame").getAttribute("src")).toBeNull();
    });
  }

  test("activates once by click, announces loading, and only reports iframe navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const requests = trackEmbedRequests(page);
    const release = await holdEmbedRequest(page);
    await page.goto("/");

    const button = page.locator("#load-substack");
    const panel = page.locator("#iframe-panel");
    const frame = page.locator("#substack-frame");
    const status = page.locator("#iframe-status");
    const externalLink = page.locator(".external-link");

    await button.click();
    await expect.poll(() => requests.length).toBe(1);
    await expect(frame).toHaveAttribute("src", EMBED_URL);
    await expect(panel).toHaveAttribute("aria-busy", "true");
    await expect(status).toHaveText(LOADING_TEXT);
    await expect(status).toBeFocused();
    await expect(externalLink).toBeVisible();
    await expect(button).toBeDisabled();

    await release();
    await expect(panel).toHaveAttribute("aria-busy", "false");
    await expect(status).toHaveText(LOADED_TEXT);
    await button.click({ force: true });
    expect(requests).toHaveLength(1);
  });

  for (const key of ["Enter", "Space"]) {
    test(`activates exactly once with ${key}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const requests = trackEmbedRequests(page);
      await fulfillWithHtml(page);
      await page.goto("/");
      const button = page.locator("#load-substack");
      await button.focus();
      await page.keyboard.press(key);
      await expect.poll(() => requests.length).toBe(1);
      await expect(page.locator("#substack-frame")).toHaveAttribute("src", EMBED_URL);
      await button.focus();
      await page.keyboard.press(key);
      expect(requests).toHaveLength(1);
    });
  }

  test("uses the explicit short timeout and keeps focus stable on timeout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.clock.install();
    await replaceServedTimeout(page, (body) => body.replace('data-timeout-ms="12000"', 'data-timeout-ms="25"'));
    const requests = trackEmbedRequests(page);
    await page.route(EMBED_URL, () => new Promise(() => {}));
    await page.goto("/");
    await page.locator("#load-substack").click();
    await expect.poll(() => requests.length).toBe(1);
    await page.locator(".external-link").focus();
    await page.clock.runFor(26);
    await expect(page.locator("#iframe-panel")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("#iframe-status")).toHaveText(TIMEOUT_TEXT);
    await expect(page.locator(".external-link")).toHaveClass(/is-highlighted/);
    await expect(page.locator(".external-link")).toBeFocused();
    await expect(page.locator(".external-link")).toHaveAttribute("href", "https://fazedordecodigo.substack.com/");
  });

  for (const [label, attribute] of [
    ["missing", (body) => body.replace(' data-timeout-ms="12000"', "")],
    ["zero", (body) => body.replace('data-timeout-ms="12000"', 'data-timeout-ms="0"')],
    ["negative", (body) => body.replace('data-timeout-ms="12000"', 'data-timeout-ms="-50"')],
    ["nonnumeric", (body) => body.replace('data-timeout-ms="12000"', 'data-timeout-ms="oops"')],
  ]) {
    test(`falls back to 12000ms for ${label} timeout data`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.clock.install();
      await replaceServedTimeout(page, attribute);
      const requests = trackEmbedRequests(page);
      await page.route(EMBED_URL, () => new Promise(() => {}));
      await page.goto("/");
      await page.locator("#load-substack").click();
      await expect.poll(() => requests.length).toBe(1);
      await page.clock.runFor(12_001);
      await expect(page.locator("#iframe-panel")).toHaveAttribute("aria-busy", "false");
      await expect(page.locator("#iframe-status")).toHaveText(TIMEOUT_TEXT);
      await expect(page.locator("body")).not.toBeFocused();
    });
  }

  for (const width of [320, 480]) {
    test(`offers only the external link at ${width}px`, async ({ page }) => {
      const requests = trackEmbedRequests(page);
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      await expect(page.locator("#load-substack")).toBeHidden();
      await expect(page.locator("#embed-facade")).toBeHidden();
      await expect(page.locator("#substack-frame")).toBeHidden();
      await expect(page.locator("#mobile-embed-message")).toBeVisible();
      await expect(page.locator("#mobile-embed-message")).toHaveText(MOBILE_TEXT);
      await expect(page.locator(".external-link")).toBeVisible();
      expect(requests).toHaveLength(0);
      expect(await page.locator("#substack-frame").getAttribute("src")).toBeNull();
    });
  }

  test("keeps a usable frame width at the 481px activation boundary", async ({ page }) => {
    await page.setViewportSize({ width: 481, height: 1000 });
    await fulfillWithHtml(page);
    await page.goto("/");
    await page.locator("#load-substack").click();
    await expect(page.locator("#substack-frame")).toHaveAttribute("src", EMBED_URL);
    const frame = await page.locator("#substack-frame").boundingBox();
    expect(frame?.width ?? 0).toBeGreaterThanOrEqual(320);
  });
});
