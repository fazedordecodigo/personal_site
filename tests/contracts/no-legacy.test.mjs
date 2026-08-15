import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { parse } from "parse5";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const legacyPaths = [
  "index.html",
  "css",
  "js",
  "sass",
  "fonts",
  "images",
  ".github/workflows/azure-static-web-apps-orange-smoke-089e11b1e.yml",
];

async function walkFiles(path) {
  const files = [];
  try {
    await readdir(path);
  } catch (error) {
    if (error.code === "ENOENT") return files;
    throw error;
  }
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, path);
    if (entry.isDirectory()) files.push(...await walkFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

test("removes the enumerated legacy paths and tracked Finder artifacts", async () => {
  for (const path of legacyPaths) {
    await assert.rejects(stat(new URL(path, root)), /ENOENT/, path);
  }
  for (const path of [
    ".DS_Store",
    "css/.DS_Store",
    "fonts/.DS_Store",
    "fonts/icomoon/.DS_Store",
    "fonts/icomoon/icomoon/.DS_Store",
    "images/.DS_Store",
    "js/.DS_Store",
    "sass/.DS_Store",
  ]) await assert.rejects(stat(new URL(path, root)), /ENOENT/, path);
});

test("keeps authored source, workflows and built resource attributes free of legacy runtime", async () => {
  const authoredFiles = [
    new URL("package.json", root),
    ...(await walkFiles(new URL("src/", root))),
    ...(await walkFiles(new URL(".github/workflows/", root))),
  ];
  const forbiddenSource = /bootstrap|jquery|allorigins|sociablekit|fonts\.googleapis|icomoon|\bsass\b|\.map|demo-files/i;
  for (const file of authoredFiles) assert.doesNotMatch(await readFile(file, "utf8"), forbiddenSource, file.pathname);

  const html = await readFile(new URL("public/index.html", root), "utf8");
  const document = parse(html);
  const runtimeValues = [];
  const walk = (node) => {
    if (node.tagName) {
      const attributes = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
      for (const name of ["class", "id"]) if (attributes[name]) runtimeValues.push(attributes[name]);
      if (["script", "link", "img", "iframe"].includes(node.tagName)) {
        for (const name of ["src", "href", "data-src"]) if (attributes[name]) runtimeValues.push(attributes[name]);
      }
    }
    for (const child of node.childNodes ?? []) walk(child);
  };
  walk(document);
  for (const value of runtimeValues) assert.doesNotMatch(value, /bootstrap|jquery|allorigins|sociablekit|icomoon|stellar|animate|carousel|image-fallback|prototype/i, value);
});
