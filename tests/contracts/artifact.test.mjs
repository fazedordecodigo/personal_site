import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ARTIFACT_ALLOWLIST, checkArtifact } from "../../scripts/check-artifact.mjs";

const publicRoot = new URL("../../public/", import.meta.url);

async function withArtifactCopy(callback) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "personal-site-artifact-"));
  const artifactRoot = join(temporaryRoot, "public");
  await cp(publicRoot, artifactRoot, { recursive: true });
  try {
    return await callback(artifactRoot);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

test("accepts the exact artifact allowlist and reports bounded transfer sizes", async () => {
  const report = await checkArtifact({ root: publicRoot.pathname });
  assert.deepEqual(report.files.map(({ path }) => path), [...ARTIFACT_ALLOWLIST].sort());
  assert.ok(report.initialTransferBytes <= 350 * 1024);
  assert.ok(report.files.find(({ path }) => path === "css/site.css").gzipBytes <= 20 * 1024);
  assert.ok(report.files.find(({ path }) => path === "js/substack-embed.js").gzipBytes <= 5 * 1024);
  for (const file of report.files) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(file.bytes > 0, file.path);
  }
  assert.deepEqual(
    await readFile(new URL("../../public/staticwebapp.config.json", import.meta.url)),
    await readFile(new URL("../../staticwebapp.config.json", import.meta.url)),
  );
});

test("rejects missing and extra artifact paths", async () => {
  await withArtifactCopy(async (root) => {
    await unlink(join(root, "index.html"));
    await assert.rejects(checkArtifact({ root }), /allowlist|missing/i);
  });
  await withArtifactCopy(async (root) => {
    await writeFile(join(root, "unexpected.txt"), "no");
    await assert.rejects(checkArtifact({ root }), /allowlist|extra/i);
  });
});

test("rejects symlinks, source maps, path escapes and arbitrary fonts", async () => {
  await withArtifactCopy(async (root) => {
    const outside = await mkdtemp(join(tmpdir(), "personal-site-artifact-outside-"));
    try {
      await writeFile(join(outside, "secret.txt"), "secret");
      await symlink(join(outside, "secret.txt"), join(root, "escape.txt"));
      await assert.rejects(checkArtifact({ root }), /symlink|allowlist/i);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });
  await withArtifactCopy(async (root) => {
    await writeFile(join(root, "js", "substack-embed.js.map"), "{}");
    await assert.rejects(checkArtifact({ root }), /allowlist|extra/i);
  });
  await withArtifactCopy(async (root) => {
    await writeFile(join(root, "assets", "fonts", "unused.woff2"), "font");
    await assert.rejects(checkArtifact({ root }), /allowlist|extra/i);
  });
  const workspace = await mkdtemp(join(tmpdir(), "personal-site-artifact-workspace-"));
  try {
    await mkdir(join(workspace, "public"));
    await mkdir(join(workspace, "outside"));
    await assert.rejects(checkArtifact({ root: "../outside", workspaceRoot: join(workspace, "public") }), /escape/i);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("emits stable bytes for the checked artifact", async () => {
  const report = await checkArtifact({ root: publicRoot.pathname });
  const image = report.files.find(({ path }) => path === "assets/images/emerson-delatorre.jpg");
  const bytes = (await readFile(new URL("../../public/assets/images/emerson-delatorre.jpg", import.meta.url))).length;
  assert.equal(image.bytes, bytes);
});
