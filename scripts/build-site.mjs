import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { SnapshotContractError, FeedFetchError, loadArticles } from "./articles/load-articles.mjs";
import { copyStaticAssets } from "./copy-static-assets.mjs";
import { renderSite } from "./render-site.mjs";
import { STATIC_COPY_MANIFEST } from "./static-assets.mjs";

export const nodeFsAdapter = {
  lstat: (...args) => import("node:fs/promises").then(({ lstat }) => lstat(...args)),
  mkdir: (...args) => mkdir(...args),
  readFile: (...args) => readFile(...args),
  readdir: (...args) => readdir(...args),
  realpath: (...args) => import("node:fs/promises").then(({ realpath }) => realpath(...args)),
  rename: (...args) => rename(...args),
  rm: (...args) => rm(...args),
  writeFile: (...args) => writeFile(...args),
  copyFile: (...args) => import("node:fs/promises").then(({ copyFile }) => copyFile(...args)),
};

function contained(candidate, root) {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === "" || (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

function buildReport({ mode, state, source, fallbackReasonCode, outputFiles = [], fetchedAt = null }) {
  return {
    status: "blocked",
    articleMode: mode,
    state,
    articleSource: source,
    articleCount: 0,
    snapshotFetchedAt: fetchedAt,
    outputFiles,
    fallbackReasonCode,
  };
}

async function writeReport(root, report, fsImpl) {
  const destination = join(root, "build-report.json");
  const temporary = `${destination}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;
  try {
    await fsImpl.writeFile(temporary, `${JSON.stringify(report)}\n`, { encoding: "utf8", flag: "wx" });
    await fsImpl.rename(temporary, destination);
  } finally {
    await fsImpl.rm(temporary, { force: true }).catch(() => {});
  }
}

async function ensureOutputRoot(workspaceRoot, outputDir, fsImpl) {
  if (typeof outputDir !== "string" || outputDir.trim() === "") {
    throw new Error("output directory is unsafe");
  }
  const workspace = await fsImpl.realpath(workspaceRoot);
  const candidate = resolve(workspace, outputDir);
  if (candidate === workspace || candidate === resolve("/")) {
    throw new Error("output directory is unsafe");
  }
  let parent = dirname(candidate);
  while (true) {
    try {
      const resolvedParent = await fsImpl.realpath(parent);
      if (!contained(resolvedParent, workspace)) throw new Error("output directory parent escapes workspace");
      break;
    } catch (error) {
      if (error.code !== "ENOENT" || parent === dirname(parent)) throw error;
      parent = dirname(parent);
    }
  }
  try {
    const stat = await fsImpl.lstat(candidate);
    if (stat.isSymbolicLink()) throw new Error("output directory cannot be a symlink");
    const resolved = await fsImpl.realpath(candidate);
    if (!contained(resolved, workspace) || resolved !== candidate || !stat.isDirectory()) throw new Error("output directory is unsafe");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return { workspace, candidate };
}

async function listFiles(root, fsImpl, prefix = "") {
  const entries = [];
  for (const entry of await fsImpl.readdir(root, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const target = join(root, entry.name);
    if (entry.isDirectory()) entries.push(...await listFiles(target, fsImpl, relativePath));
    else if (entry.isFile()) entries.push(relativePath);
    else throw new Error("generated output cannot contain symlinks");
  }
  return entries.sort();
}

async function removePath(path, fsImpl) {
  await fsImpl.rm(path, { recursive: true, force: true });
}

async function swapOutput({ output, temporary, workspace, fsImpl }) {
  const backup = join(workspace, `.public.backup-${process.pid}-${Math.random().toString(36).slice(2)}`);
  let movedOld = false;
  try {
    try {
      await fsImpl.lstat(output);
      await fsImpl.rename(output, backup);
      movedOld = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await fsImpl.rename(temporary, output);
    try {
      if (movedOld) await removePath(backup, fsImpl);
    } catch (error) {
      await fsImpl.rename(output, temporary).catch(() => {});
      await fsImpl.rename(backup, output).catch(() => {});
      throw error;
    }
  } catch (error) {
    await removePath(temporary, fsImpl).catch(() => {});
    if (movedOld) {
      try {
        await fsImpl.lstat(backup);
        await fsImpl.rename(backup, output);
      } catch {
        // Preserve the original error; the backup path is still audited by the caller.
      }
    }
    throw error;
  }
}

export async function buildSite({
  articleMode = "snapshot",
  outputDir = "public",
  workspaceRoot = process.cwd(),
  now = () => new Date(),
  fetchImpl = globalThis.fetch,
  sleep,
  fsImpl = nodeFsAdapter,
} = {}) {
  const { workspace, candidate: output } = await ensureOutputRoot(workspaceRoot, outputDir, fsImpl);
  const snapshotPath = join(workspace, "content/articles.snapshot.json");
  let feedResult;
  try {
    feedResult = await loadArticles({ mode: articleMode, snapshotPath, now, fetchImpl, sleep });
  } catch (error) {
    const source = articleMode === "remote-required" ? "remote" : "snapshot";
    const report = buildReport({
      mode: articleMode,
      state: articleMode === "remote-required" ? "refresh-error" : "empty",
      source,
      fallbackReasonCode: error instanceof SnapshotContractError ? "SNAPSHOT_INVALID" : error instanceof FeedFetchError ? error.code : "SNAPSHOT_INVALID",
    });
    await writeReport(workspace, report, fsImpl);
    return report;
  }

  const temporary = join(workspace, `.public.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`);
  try {
    await fsImpl.mkdir(temporary, { recursive: false });
    const template = await fsImpl.readFile(join(workspace, "src/index.template.html"), "utf8");
    const html = renderSite({ template, feedResult });
    await fsImpl.writeFile(join(temporary, "index.html"), html, { encoding: "utf8", flag: "wx" });
    await copyStaticAssets({ sourceRoot: workspace, outputRoot: temporary, manifest: STATIC_COPY_MANIFEST, fsImpl });
    const outputFiles = await listFiles(temporary, fsImpl);
    const report = {
      status: "built",
      articleMode,
      state: feedResult.state,
      articleSource: feedResult.source,
      articleCount: feedResult.articles.length,
      snapshotFetchedAt: feedResult.fetchedAt,
      outputFiles,
      fallbackReasonCode: feedResult.warningCode,
    };
    await writeReport(workspace, report, fsImpl);
    await swapOutput({ output, temporary, workspace, fsImpl });
    return report;
  } catch (error) {
    await removePath(temporary, fsImpl).catch(() => {});
    throw error;
  }
}

async function main() {
  const argument = process.argv.find((value) => value.startsWith("--mode="));
  const articleMode = argument?.slice("--mode=".length) ?? "snapshot";
  const report = await buildSite({ articleMode });
  console.log(JSON.stringify(report));
  if (report.status === "blocked") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
