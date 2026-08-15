import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "parse5";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const readText = (path) => readFile(new URL(path, root), "utf8");
const html = await readText("public/index.html");
const document = parse(html);

function walk(node, callback) {
  callback(node);
  for (const child of node.childNodes ?? []) walk(child, callback);
}

function elements(name) {
  const result = [];
  walk(document, (node) => {
    if (node.tagName === name) result.push(node);
  });
  return result;
}

function attr(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

const config = JSON.parse(await readText("staticwebapp.config.json"));
const expectedCsp = "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src https://fazedordecodigo.substack.com; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

test("keeps resources local until the explicit iframe boundary", async () => {
  assert.equal(elements("script").length, 1);
  assert.equal(attr(elements("script")[0], "src"), "/js/substack-embed.js");
  assert.equal(attr(elements("script")[0], "defer"), "");
  assert.deepEqual(elements("link").filter((node) => attr(node, "rel") === "stylesheet").map((node) => attr(node, "href")), ["/css/site.css"]);
  assert.deepEqual(elements("img").map((node) => attr(node, "src")), ["/assets/images/emerson-delatorre.jpg"]);
  const frames = elements("iframe");
  assert.equal(frames.length, 1);
  assert.equal(attr(frames[0], "src"), undefined);
  assert.equal(attr(frames[0], "data-src"), "https://fazedordecodigo.substack.com/embed");
  const resourceNodes = [...elements("script"), ...elements("link").filter((node) => attr(node, "rel") === "stylesheet"), ...elements("img")];
  for (const node of resourceNodes) {
    const url = attr(node, "src") ?? attr(node, "href");
    assert.ok(url?.startsWith("/"), `resource must be local: ${url}`);
  }
  assert.doesNotMatch(await readText("src/css/site.css"), /url\([^)]*https?:\/\//i);
  assert.doesNotMatch(await readText("src/js/substack-embed.js"), /fetch|innerHTML|outerHTML|insertAdjacentHTML|document\.write|postMessage|localStorage|sessionStorage/);
});

test("rejects inline code, unsafe attributes and unapproved runtime dependencies", async () => {
  for (const node of [
    ...elements("html"),
    ...elements("head"),
    ...elements("body"),
    ...elements("script"),
    ...elements("link"),
    ...elements("iframe"),
    ...elements("img"),
  ]) {
    assert.equal(attr(node, "style"), undefined);
    for (const attribute of node.attrs ?? []) assert.equal(attribute.name.startsWith("on"), false);
  }
  assert.equal(elements("style").length, 0);
  assert.equal(elements("script")[0].childNodes?.length ?? 0, 0);
  const forbidden = /allorigins|sociablekit|fonts\.googleapis|jquery|bootstrap|icomoon|stellar|animate\.css/i;
  for (const node of [...elements("script"), ...elements("link"), ...elements("iframe"), ...elements("img")]) {
    const value = `${attr(node, "src") ?? ""} ${attr(node, "href") ?? ""} ${attr(node, "data-src") ?? ""}`;
    assert.doesNotMatch(value, forbidden);
  }
});

test("publishes the exact blocking headers without a SPA fallback", () => {
  assert.equal(config.navigationFallback, undefined);
  assert.equal(config.globalHeaders["Content-Security-Policy"], expectedCsp);
  assert.deepEqual(config.globalHeaders, {
    "Content-Security-Policy": expectedCsp,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  });
});
