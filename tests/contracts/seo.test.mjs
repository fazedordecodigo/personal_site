import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "parse5";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const html = await readFile(new URL("public/index.html", root), "utf8");
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

function textContent(node) {
  return (node.childNodes ?? []).map((child) => child.nodeName === "#text" ? child.value : textContent(child)).join("");
}

function metaMap(attribute) {
  return Object.fromEntries(elements("meta").map((node) => [attr(node, attribute), attr(node, "content")]).filter(([key]) => key));
}

function jpegDimensions(bytes) {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error("JPEG dimensions not found");
}

test("keeps the exact canonical and social metadata", async () => {
  assert.equal(textContent(elements("title")[0]), "Emerson Delatorre — Engenharia de Software, IA e Educação");
  const names = metaMap("name");
  assert.equal(names.description, "Engenharia de software, inteligência artificial e ensino prático. Conheça projetos, artigos e o Fazedor de Código.");
  const properties = metaMap("property");
  assert.deepEqual(properties, {
    "og:type": "website",
    "og:locale": "pt_BR",
    "og:site_name": "Emerson Delatorre",
    "og:title": "Emerson Delatorre — Engenharia de Software, IA e Educação",
    "og:description": "Engenharia de software, inteligência artificial e ensino prático. Conheça projetos, artigos e o Fazedor de Código.",
    "og:url": "https://delatorre.dev/",
    "og:image": "https://delatorre.dev/assets/images/emerson-delatorre.jpg",
    "og:image:width": "400",
    "og:image:height": "400",
    "og:image:alt": "Retrato de Emerson Delatorre",
  });
  assert.deepEqual(metaMap("name"), {
    viewport: "width=device-width, initial-scale=1",
    description: names.description,
    "twitter:card": "summary",
    "twitter:title": "Emerson Delatorre — Engenharia de Software, IA e Educação",
    "twitter:description": "Engenharia de software, inteligência artificial e ensino prático. Conheça projetos, artigos e o Fazedor de Código.",
    "twitter:image": "https://delatorre.dev/assets/images/emerson-delatorre.jpg",
    "twitter:image:alt": "Retrato de Emerson Delatorre",
  });
  const canonicals = elements("link").filter((node) => attr(node, "rel") === "canonical");
  assert.deepEqual(canonicals.map((node) => attr(node, "href")), ["https://delatorre.dev/"]);
});

test("keeps the social image, robots, sitemap and article links crawlable", async () => {
  const image = await readFile(new URL("public/assets/images/emerson-delatorre.jpg", root));
  assert.deepEqual(jpegDimensions(image), { width: 400, height: 400 });
  assert.doesNotMatch(html, /noindex|name=["']keywords|application\/ld\+json/i);
  const robots = await readFile(new URL("public/robots.txt", root), "utf8");
  assert.match(robots, /^User-agent: \*\nAllow: \/\nSitemap: https:\/\/delatorre\.dev\/sitemap\.xml\n$/);
  const sitemap = await readFile(new URL("public/sitemap.xml", root), "utf8");
  assert.equal((sitemap.match(/<loc>https:\/\/delatorre\.dev\/<\/loc>/g) ?? []).length, 1);
  const articleLinks = elements("a").map((node) => attr(node, "href")).filter((href) => href?.startsWith("https://fazedordecodigo.substack.com/p/"));
  assert.equal(articleLinks.length, 3);
  assert.equal(new Set(articleLinks).size, 3);
});
