import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { STATIC_COPY_MANIFEST } from "./static-assets.mjs";

const defaultFs = {
  copyFile: (...args) => import("node:fs/promises").then(({ copyFile }) => copyFile(...args)),
  lstat: (...args) => import("node:fs/promises").then(({ lstat }) => lstat(...args)),
  mkdir: (...args) => import("node:fs/promises").then(({ mkdir }) => mkdir(...args)),
  realpath: (...args) => import("node:fs/promises").then(({ realpath }) => realpath(...args)),
};

function contained(candidate, root) {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === "" || (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

async function assertRegularFile(path, fsImpl) {
  const stat = await fsImpl.lstat(path);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`Static asset is not a regular file: ${path}`);
  }
}

export async function copyStaticAssets({
  sourceRoot,
  outputRoot,
  manifest = STATIC_COPY_MANIFEST,
  fsImpl = defaultFs,
}) {
  const sourceBase = await fsImpl.realpath(sourceRoot);
  const outputBase = await fsImpl.realpath(outputRoot);
  for (const entry of manifest) {
    const sourcePath = resolve(sourceBase, entry.source);
    const destinationPath = resolve(outputBase, entry.destination);
    if (!contained(sourcePath, sourceBase) || !contained(destinationPath, outputBase)) {
      throw new Error("Static asset path escapes its root.");
    }
    await assertRegularFile(sourcePath, fsImpl);
    await fsImpl.mkdir(dirname(destinationPath), { recursive: true });
    try {
      const destinationStat = await fsImpl.lstat(destinationPath);
      if (destinationStat.isSymbolicLink()) {
        throw new Error(`Static asset destination is a symlink: ${destinationPath}`);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await fsImpl.copyFile(sourcePath, destinationPath);
  }
}
