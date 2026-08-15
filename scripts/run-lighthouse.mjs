import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lighthouseBinary = join(repositoryRoot, "node_modules", ".bin", process.platform === "win32" ? "lhci.cmd" : "lhci");

await access(lighthouseBinary);
const child = spawn(lighthouseBinary, ["autorun", "--config=lighthouserc.cjs"], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    CHROME_PATH: chromium.executablePath(),
  },
  stdio: "inherit",
});

child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) process.exitCode = 1;
  else process.exitCode = code ?? 1;
});
