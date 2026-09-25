import { createReadStream } from "node:fs";
import { lstat, readdir, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzip } from "node:zlib";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const gzipAsync = promisify(gzip);

export const ARTIFACT_ALLOWLIST = Object.freeze([
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "staticwebapp.config.json",
  "css/site.css",
  "js/substack-embed.js",
  "assets/images/emerson-delatorre.jpg",
  "assets/images/fazedor-de-codigo-logo.svg",
  "assets/fonts/LICENSES.md",
  "assets/fonts/OFL-1.1.txt",
  "assets/fonts/space-grotesk-latin-700-normal.woff2",
  "assets/fonts/inter-latin-400-normal.woff2",
  "assets/fonts/inter-latin-600-normal.woff2",
  "assets/fonts/jetbrains-mono-latin-500-normal.woff2",
  "assets/fonts/jetbrains-mono-latin-700-normal.woff2",
]);

const INITIAL_TRANSFER_PATHS = new Set([
  "index.html",
  "css/site.css",
  "js/substack-embed.js",
  "assets/images/emerson-delatorre.jpg",
  "assets/fonts/space-grotesk-latin-700-normal.woff2",
  "assets/fonts/inter-latin-400-normal.woff2",
  "assets/fonts/inter-latin-600-normal.woff2",
  "assets/fonts/jetbrains-mono-latin-500-normal.woff2",
  "assets/fonts/jetbrains-mono-latin-700-normal.woff2",
]);

export class ArtifactContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "ArtifactContractError";
  }
}

function contained(candidate, root) {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === "" || (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

async function resolveArtifactRoot(root, workspaceRoot) {
  if (typeof root !== "string" || root.trim() === "") throw new ArtifactContractError("Artifact root is required.");
  let candidate = resolve(root);
  if (workspaceRoot !== undefined) {
    const workspace = await realpath(workspaceRoot);
    candidate = resolve(workspace, root);
    if (!contained(candidate, workspace)) throw new ArtifactContractError("Artifact root escapes its workspace.");
  }
  const stat = await lstat(candidate);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new ArtifactContractError("Artifact root must be a regular directory.");
  const resolved = await realpath(candidate);
  if (!contained(resolved, resolve(workspaceRoot ?? dirname(resolved))) || resolved !== candidate) {
    throw new ArtifactContractError("Artifact root resolves outside its expected path.");
  }
  return resolved;
}

async function listFiles(root, current = root, prefix = "") {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(current, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new ArtifactContractError(`Artifact contains a symlink: ${relativePath}`);
    const resolved = await realpath(path);
    if (!contained(resolved, root) || resolved !== path) throw new ArtifactContractError(`Artifact path escapes its root: ${relativePath}`);
    if (entry.isDirectory()) files.push(...await listFiles(root, path, relativePath));
    else if (entry.isFile()) files.push(relativePath);
    else throw new ArtifactContractError(`Artifact contains a non-regular path: ${relativePath}`);
  }
  return files;
}

async function hashAndMeasure(path) {
  const hash = createHash("sha256");
  const chunks = [];
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    chunks.push(chunk);
    bytes += chunk.length;
  }
  const compressed = await gzipAsync(Buffer.concat(chunks), { level: 9 });
  return { bytes, gzipBytes: compressed.length, sha256: hash.digest("hex") };
}

export async function checkArtifact({ root, workspaceRoot } = {}) {
  const artifactRoot = await resolveArtifactRoot(root, workspaceRoot);
  const actualFiles = (await listFiles(artifactRoot)).sort();
  const expectedFiles = [...ARTIFACT_ALLOWLIST].sort();
  const expected = new Set(expectedFiles);
  const actual = new Set(actualFiles);
  const missing = expectedFiles.filter((path) => !actual.has(path));
  const extra = actualFiles.filter((path) => !expected.has(path));
  if (missing.length || extra.length) {
    throw new ArtifactContractError(`Artifact allowlist mismatch; missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`);
  }

  const files = [];
  for (const path of actualFiles) {
    files.push({ path, ...(await hashAndMeasure(join(artifactRoot, path))) });
  }
  const css = files.find((file) => file.path === "css/site.css");
  const js = files.find((file) => file.path === "js/substack-embed.js");
  const initialTransferBytes = files.filter((file) => INITIAL_TRANSFER_PATHS.has(file.path)).reduce((total, file) => total + file.bytes, 0);
  if (css.gzipBytes > 20 * 1024) throw new ArtifactContractError("CSS gzip budget exceeded.");
  if (js.gzipBytes > 5 * 1024) throw new ArtifactContractError("JavaScript gzip budget exceeded.");
  if (initialTransferBytes > 350 * 1024) throw new ArtifactContractError("Initial transfer budget exceeded.");
  return { files, initialTransferBytes };
}

async function main() {
  const root = process.argv[2] ?? "public";
  try {
    const report = await checkArtifact({ root });
    process.stdout.write(`${JSON.stringify(report.files)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
