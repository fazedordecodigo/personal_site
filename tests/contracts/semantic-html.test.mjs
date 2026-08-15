import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "parse5";
import test from "node:test";

const html = await readFile(new URL("../../src/index.template.html", import.meta.url), "utf8");
const document = parse(html);

function walk(node, callback) {
  callback(node);
  for (const child of node.childNodes ?? []) walk(child, callback);
}

function elements(name) {
  const found = [];
  walk(document, (node) => {
    if (node.tagName === name) found.push(node);
  });
  return found;
}

function allElements() {
  const found = [];
  walk(document, (node) => {
    if (node.tagName) found.push(node);
  });
  return found;
}

function attr(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

test("has language, skip link, named navigation and required landmarks", () => {
  const htmlElement = elements("html")[0];
  assert.equal(attr(htmlElement, "lang"), "pt-BR");
  assert.equal(elements("header").length, 1);
  assert.ok(elements("nav").length >= 1);
  assert.ok(elements("nav").some((node) => attr(node, "aria-label") === "Navegação principal"));
  assert.equal(elements("main").length, 1);
  assert.equal(elements("footer").length, 1);
  assert.ok(elements("a").some((node) => attr(node, "href") === "#conteudo"));
});

test("has one H1, logical heading order, unique IDs and non-empty links", () => {
  assert.equal(elements("h1").length, 1);
  const headings = ["h1", "h2", "h3"].flatMap((name) => elements(name).map(() => Number(name.slice(1))));
  for (let index = 1; index < headings.length; index += 1) assert.ok(headings[index] <= headings[index - 1] + 1);
  const ids = allElements().map((node) => attr(node, "id")).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
  for (const link of elements("a")) assert.ok(attr(link, "href"));
});

test("does not use inline code, handlers or legacy prototype markup", () => {
  for (const node of allElements()) {
    assert.equal(attr(node, "style"), undefined);
    for (const attribute of node.attrs ?? []) assert.equal(attribute.name.startsWith("on"), false);
  }
  assert.equal(elements("script").length, 0);
  for (const forbidden of ["bootstrap", "jquery", "icomoon", "stellar", "animate", "carousel", "PROTÓTIPO", "?state="]) {
    assert.equal(html.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});
