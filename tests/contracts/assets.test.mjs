import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { parse } from "parse5";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFile(new URL(path, root));
const readText = (path) => readFile(new URL(path, root), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");

const fonts = [
  ["space-grotesk-latin-700-normal.woff2", "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2", "@fontsource/space-grotesk"],
  ["inter-latin-400-normal.woff2", "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2", "@fontsource/inter"],
  ["inter-latin-600-normal.woff2", "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2", "@fontsource/inter"],
  ["jetbrains-mono-latin-500-normal.woff2", "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2", "@fontsource/jetbrains-mono"],
  ["jetbrains-mono-latin-700-normal.woff2", "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2", "@fontsource/jetbrains-mono"],
];

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

function walk(node, callback) {
  callback(node);
  for (const child of node.childNodes ?? []) walk(child, callback);
}

test("keeps the approved portrait and exact local font allowlist", async () => {
  const portrait = await read("src/assets/images/emerson-delatorre.jpg");
  assert.equal(hash(portrait), "63fb6bdb780c1c3f44fa9e4b2f62dea91f0795427fed85c9b65d3c93eba62ecd");
  assert.deepEqual(jpegDimensions(portrait), { width: 400, height: 400 });
  const fontNames = (await readdir(new URL("../../src/assets/fonts/", import.meta.url))).sort();
  assert.deepEqual(fontNames, [
    "LICENSES.md",
    "OFL-1.1.txt",
    ...fonts.map(([name]) => name),
  ].sort());
  for (const [name, source, packageName] of fonts) {
    assert.equal(hash(await read(`src/assets/fonts/${name}`)), hash(await read(source)), name);
    const packageJson = JSON.parse(await read(`${source.split("/files/")[0]}/package.json`));
    assert.equal(packageJson.license, "OFL-1.1", packageName);
  }
  assert.match(await readText("src/assets/fonts/OFL-1.1.txt"), /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(await readText("src/assets/fonts/LICENSES.md"), /OFL-1\.1/);
});

test("uses only local font URLs and one dimensioned portrait", async () => {
  const css = await readText("src/css/site.css");
  for (const [name] of fonts) {
    assert.match(css, new RegExp(`/assets/fonts/${name.replaceAll(".", "\\.")}`));
  }
  assert.doesNotMatch(css, /https?:\/\//);
  assert.match(css, /font-display:\s*swap/);
  const html = await readText("src/index.template.html");
  const document = parse(html);
  const images = [];
  walk(document, (node) => {
    if (node.tagName === "img") images.push(node);
  });
  assert.equal(images.length, 1);
  const attributes = Object.fromEntries(images[0].attrs.map((entry) => [entry.name, entry.value]));
  assert.equal(attributes.src, "/assets/images/emerson-delatorre.jpg");
  assert.equal(attributes.width, "400");
  assert.equal(attributes.height, "400");
  assert.equal(attributes.fetchpriority, "high");
  assert.equal(attributes.loading, undefined);
  assert.doesNotMatch(html, /<img[^>]+article/i);
});
