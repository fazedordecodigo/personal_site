import { mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { fetchRemoteSnapshot, validateSnapshotObject } from "./load-articles.mjs";

export async function writeSnapshotAtomic(snapshot, destination) {
  validateSnapshotObject(snapshot);
  const resolvedDestination = resolve(destination);
  const temporaryPath = `${resolvedDestination}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;
  const content = `${JSON.stringify(snapshot)}\n`;
  let fileHandle;
  try {
    fileHandle = await open(temporaryPath, "wx", 0o600);
    await fileHandle.writeFile(content, "utf8");
    await fileHandle.sync();
    await fileHandle.close();
    fileHandle = undefined;
    await rename(temporaryPath, resolvedDestination);
  } finally {
    if (fileHandle !== undefined) {
      await fileHandle.close().catch(() => {});
    }
    await unlink(temporaryPath).catch(() => {});
  }
}

async function main() {
  const destination = resolve(process.cwd(), "content/articles.snapshot.json");
  await mkdir(dirname(destination), { recursive: true });
  const { snapshot } = await fetchRemoteSnapshot({});
  await writeSnapshotAtomic(snapshot, destination);
  console.log(JSON.stringify({ status: "written", destination: "content/articles.snapshot.json", articleCount: 3 }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
