import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createStaticServer } from "../../scripts/serve.mjs";

async function withServer(callback) {
  const root = await mkdtemp(join(tmpdir(), "personal-site-serve-"));
  await mkdir(join(root, "css"));
  await mkdir(join(root, "js"));
  await mkdir(join(root, "assets"));
  await writeFile(join(root, "index.html"), "<!doctype html><title>ok</title>");
  await writeFile(join(root, "css", "site.css"), "body { color: red; }");
  await writeFile(join(root, "js", "app.js"), "console.log('ok');");
  await writeFile(join(root, "assets", "data.json"), "{\"ok\":true}");
  await writeFile(join(root, "assets", "feed.xml"), "<feed />");
  await writeFile(join(root, "assets", "font.woff2"), "font");
  await writeFile(join(root, "assets", "photo.jpeg"), "jpeg");

  const outside = await mkdtemp(join(tmpdir(), "personal-site-outside-"));
  await writeFile(join(outside, "secret.txt"), "secret");
  await symlink(join(outside, "secret.txt"), join(root, "assets", "link.txt"));

  const server = createStaticServer({ root });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const { port, address } = server.address();
    assert.equal(address, "127.0.0.1");
    await callback(`http://127.0.0.1:${port}`, root);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test("serves the allowlisted static file types with explicit MIME types", async () => {
  await withServer(async (base) => {
    const cases = [
      ["/", "text/html; charset=utf-8"],
      ["/index.html", "text/html; charset=utf-8"],
      ["/css/site.css", "text/css; charset=utf-8"],
      ["/js/app.js", "text/javascript; charset=utf-8"],
      ["/assets/data.json", "application/json; charset=utf-8"],
      ["/assets/feed.xml", "application/xml; charset=utf-8"],
      ["/assets/font.woff2", "font/woff2"],
      ["/assets/photo.jpeg", "image/jpeg"],
    ];
    for (const [path, expectedType] of cases) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("content-type"), expectedType, path);
    }
  });
});

test("supports HEAD without a response body and rejects unsupported methods", async () => {
  await withServer(async (base) => {
    const head = await fetch(`${base}/index.html`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.equal(head.headers.get("content-type"), "text/html; charset=utf-8");

    const post = await fetch(`${base}/index.html`, { method: "POST" });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get("allow"), "GET, HEAD");
  });
});

test("returns 404 for unknown files and does not follow symlinks", async () => {
  await withServer(async (base) => {
    for (const path of ["/missing", "/assets/link.txt"]) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 404, path);
    }
  });
});

test("rejects traversal, NUL and malformed URL requests", async () => {
  await withServer(async (base) => {
    for (const path of [
      "/../secret.txt",
      "/%2e%2e/secret.txt",
      "/%2E%2E%2Fsecret.txt",
      "/assets/%00secret.txt",
    ]) {
      const response = await fetch(`${base}${path}`);
      assert.ok([400, 404].includes(response.status), `${path}: ${response.status}`);
    }
    const malformed = await fetch(`${base}/%E0%A4%A`);
    assert.equal(malformed.status, 400);
  });
});
