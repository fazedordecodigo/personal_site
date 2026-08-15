import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { buildSite, nodeFsAdapter } from "../../scripts/build-site.mjs";

const feedSnapshot = () => ({
  schemaVersion: 1,
  sourceUrl: "https://fazedordecodigo.substack.com/feed",
  fetchedAt: "2026-08-15T10:00:00.000Z",
  timeZone: "America/Sao_Paulo",
  articles: [1, 2, 3].map((number) => ({
    id: `urn:fixture:${number}`,
    title: `Fazedor de Código: artigo ${number}`,
    excerpt: `Resumo ${number}.`,
    publishedAt: `2026-08-${String(10 + number).padStart(2, "0")}T12:00:00.000Z`,
    url: `https://fazedordecodigo.substack.com/p/fixture-${number}`,
    eyebrow: "Fazedor de Código",
  })),
});

async function makeWorkspace({ invalidTemplate = false, invalidSnapshot = false } = {}) {
  const workspace = await mkdtemp(join(tmpdir(), "personal-site-build-"));
  await writeFile(join(workspace, "src-index.template.html"), "");
  await import("node:fs/promises").then(({ mkdir }) => Promise.all([
    mkdir(join(workspace, "src", "css"), { recursive: true }),
    mkdir(join(workspace, "src", "js"), { recursive: true }),
    mkdir(join(workspace, "src", "assets", "images"), { recursive: true }),
    mkdir(join(workspace, "src", "assets", "fonts"), { recursive: true }),
    mkdir(join(workspace, "content"), { recursive: true }),
  ]));
  await writeFile(join(workspace, "src", "index.template.html"), invalidTemplate ? "<!-- ARTICLES_SLOT --><!-- ARTICLES_SLOT -->" : "<!doctype html><html><body><!-- ARTICLES_SLOT --></body></html>");
  await writeFile(join(workspace, "src", "robots.txt"), "User-agent: *\nAllow: /\n");
  await writeFile(join(workspace, "src", "sitemap.xml"), "<?xml version=\"1.0\"?><urlset></urlset>\n");
  await writeFile(join(workspace, "staticwebapp.config.json"), "{}\n");
  await writeFile(join(workspace, "src", "css", "site.css"), "body { color: red; }\n");
  await writeFile(join(workspace, "src", "js", "substack-embed.js"), "(() => {})();\n");
  await writeFile(join(workspace, "src", "assets", "images", "emerson-delatorre.jpg"), "jpeg");
  for (const name of [
    "space-grotesk-latin-700-normal.woff2",
    "inter-latin-400-normal.woff2",
    "inter-latin-600-normal.woff2",
    "jetbrains-mono-latin-500-normal.woff2",
    "jetbrains-mono-latin-700-normal.woff2",
    "LICENSES.md",
    "OFL-1.1.txt",
  ]) await writeFile(join(workspace, "src", "assets", "fonts", name), name);
  await writeFile(join(workspace, "content", "articles.snapshot.json"), JSON.stringify(invalidSnapshot ? { bad: true } : feedSnapshot()));
  return workspace;
}

async function snapshotBytes(path) {
  const entries = [];
  const visit = async (current, prefix = "") => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const target = join(current, entry.name);
      if (entry.isDirectory()) await visit(target, relative);
      else entries.push([relative, await readFile(target)]);
    }
  };
  try {
    await visit(path);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return entries.sort();
}

test("successful snapshot build returns built report and swaps public atomically", async () => {
  const workspace = await makeWorkspace();
  const report = await buildSite({ workspaceRoot: workspace, outputDir: "public", now: () => new Date("2026-08-15T12:17:00.000Z") });
  assert.equal(report.status, "built");
  assert.equal(report.articleCount, 3);
  assert.equal(report.articleSource, "snapshot");
  assert.equal(report.state, "fresh");
  const expectedFiles = [
    "assets/fonts/LICENSES.md",
    "assets/fonts/OFL-1.1.txt",
    "assets/fonts/inter-latin-400-normal.woff2",
    "assets/fonts/inter-latin-600-normal.woff2",
    "assets/fonts/jetbrains-mono-latin-500-normal.woff2",
    "assets/fonts/jetbrains-mono-latin-700-normal.woff2",
    "assets/fonts/space-grotesk-latin-700-normal.woff2",
    "assets/images/emerson-delatorre.jpg",
    "css/site.css",
    "index.html",
    "js/substack-embed.js",
    "robots.txt",
    "sitemap.xml",
    "staticwebapp.config.json",
  ];
  assert.deepEqual(report.outputFiles, expectedFiles);
  assert.deepEqual((await snapshotBytes(join(workspace, "public"))).map(([name]) => name), expectedFiles);
  assert.equal(JSON.parse(await readFile(join(workspace, "build-report.json"))).status, "built");
});

test("invalid snapshot blocks before rendering and preserves the previous artifact", async () => {
  const workspace = await makeWorkspace({ invalidSnapshot: true });
  await writeFile(join(workspace, "src", "index.template.html"), "<!-- ARTICLES_SLOT --><!-- ARTICLES_SLOT -->");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(join(workspace, "public"), { recursive: true }));
  await writeFile(join(workspace, "public", "old.txt"), "old");
  const before = await snapshotBytes(join(workspace, "public"));
  const report = await buildSite({ workspaceRoot: workspace, outputDir: "public" });
  assert.equal(report.status, "blocked");
  assert.equal(report.state, "empty");
  assert.equal(report.fallbackReasonCode, "SNAPSHOT_INVALID");
  assert.deepEqual(await snapshotBytes(join(workspace, "public")), before);
});

test("remote failure blocks without falling back to the repository snapshot", async () => {
  const workspace = await makeWorkspace();
  const before = await snapshotBytes(join(workspace, "public"));
  const report = await buildSite({
    workspaceRoot: workspace,
    outputDir: "public",
    articleMode: "remote-required",
    fetchImpl: async () => new Response("busy", { status: 503 }),
    sleep: async () => {},
  });
  assert.equal(report.status, "blocked");
  assert.equal(report.state, "refresh-error");
  assert.equal(report.fallbackReasonCode, "HTTP_STATUS");
  assert.deepEqual(await snapshotBytes(join(workspace, "public")), before);
});

test("rejects unsafe output roots before reading or writing", async () => {
  const workspace = await makeWorkspace();
  for (const outputDir of ["", ".", workspace, "/", "../outside"]) {
    await assert.rejects(buildSite({ workspaceRoot: workspace, outputDir }), /output/i, outputDir || "empty");
  }
});

test("render, copy and promotion failures preserve public and remove transaction siblings", async () => {
  const workspace = await makeWorkspace();
  await import("node:fs/promises").then(({ mkdir }) => mkdir(join(workspace, "public"), { recursive: true }));
  await writeFile(join(workspace, "public", "old.txt"), "old");
  const before = await snapshotBytes(join(workspace, "public"));
  const fail = async (method) => {
    const fsImpl = { ...nodeFsAdapter, [method]: async () => { throw new Error(`${method} failed`); } };
    await assert.rejects(buildSite({ workspaceRoot: workspace, outputDir: "public", fsImpl }), /failed/);
    assert.deepEqual(await snapshotBytes(join(workspace, "public")), before);
    const siblings = (await readdir(workspace)).filter((entry) => entry.startsWith(".public.tmp-") || entry.startsWith(".public.backup-"));
    assert.deepEqual(siblings, []);
  };
  await fail("copyFile");
  await fail("rename");
});

test("rejects an output symlink and a parent that resolves outside the workspace", async () => {
  const workspace = await makeWorkspace();
  const outside = await mkdtemp(join(tmpdir(), "personal-site-outside-build-"));
  const { symlink } = await import("node:fs/promises");
  await symlink(outside, join(workspace, "public-link"));
  await assert.rejects(buildSite({ workspaceRoot: workspace, outputDir: "public-link" }), /symlink|output/i);
  await assert.rejects(buildSite({ workspaceRoot: workspace, outputDir: resolve(outside, "public") }), /output/i);
});
