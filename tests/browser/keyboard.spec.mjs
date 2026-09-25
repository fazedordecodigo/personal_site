import { expect, test } from "@playwright/test";

const EMBED_URL = "https://fazedordecodigo.substack.com/embed";

async function activeSummary(page) {
  return page.evaluate(() => ({
    id: document.activeElement?.id,
    className: document.activeElement?.className,
    text: (document.activeElement?.textContent || "").trim().replace(/\s+/g, " "),
  }));
}

test.describe("keyboard and focus contracts", () => {
  test("follows the exact desktop tab order and has no focus trap", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const expected = [
      "Pular para o conteúdo",
      "EMERSON_",
      "Início",
      "Quem é",
      "Comunidade",
      "Eventos",
      "Palestras",
      "Artigos",
      "Newsletter",
      "Contato",
      "Ver palestras e eventos",
      "Vamos conversar",
      "Ver PyFlunt no GitHub",
      "Visitar fazedordecodigo.com",
      "Abrir Devin Meetup no Luma",
      "Abrir Cursor Meetup no Luma",
      "Ver mais palestras",
      "Ver mais no Sessionize",
      "Ler no Substack →",
      "Ler no Substack →",
      "Ler no Substack →",
      "Ver todos os artigos no Substack",
      "Carregar formulário do Substack",
      "Assinar no Substack",
      "LinkedIn",
      "GitHub",
      "Fazedor de Código",
      "Substack",
    ];
    for (const text of expected) {
      await page.keyboard.press("Tab");
      expect((await activeSummary(page)).text).toBe(text);
    }
    await page.keyboard.press("Tab");
    expect(await activeSummary(page)).toEqual({ id: "", className: "", text: expect.stringContaining("Pular para o conteúdo") });
    await page.keyboard.press("Shift+Tab");
    expect((await activeSummary(page)).text).toBe("Substack");
  });

  test("activates skip link and traverses iframe then external fallback", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.route(EMBED_URL, (route) => route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><html><body><p>Embedded test.</p></body></html>",
    }));
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#conteudo$/);
    await page.locator("#load-substack").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#substack-frame")).toHaveAttribute("src", EMBED_URL);
    await expect(page.locator("#iframe-status")).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await activeSummary(page)).toEqual({ id: "substack-frame", className: "", text: "" });
    await page.keyboard.press("Tab");
    expect((await activeSummary(page)).text).toBe("Assinar no Substack");
  });

  test("omits the iframe control from the mobile focus order", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 1000 });
    await page.goto("/");
    const focused = [];
    for (let index = 0; index < 30; index += 1) {
      await page.keyboard.press("Tab");
      const current = await activeSummary(page);
      if (current.text.includes("Pular para o conteúdo") && focused.length > 0) break;
      focused.push(current);
    }
    expect(focused.some(({ id }) => id === "load-substack")).toBe(false);
    expect(focused.some(({ id }) => id === "substack-frame")).toBe(false);
    expect(focused.some(({ text }) => text === "Assinar no Substack")).toBe(true);
  });
});
