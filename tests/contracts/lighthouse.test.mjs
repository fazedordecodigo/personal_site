import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseChromeFlags } from "lighthouse/cli/run.js";

const require = createRequire(import.meta.url);
const LighthouseRunner = require("@lhci/cli/src/collect/node-runner.js");
const configPath = require.resolve("../../lighthouserc.cjs");

function loadCollect(githubActions) {
  const previous = process.env.GITHUB_ACTIONS;

  if (githubActions === undefined) delete process.env.GITHUB_ACTIONS;
  else process.env.GITHUB_ACTIONS = githubActions;
  delete require.cache[configPath];

  try {
    return require(configPath).ci.collect;
  } finally {
    delete require.cache[configPath];
    if (previous === undefined) delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = previous;
  }
}

async function effectiveChromeFlags(githubActions) {
  const collect = loadCollect(githubActions);
  const { args, cleanupFn } = LighthouseRunner.computeArgumentsAndCleanup(collect.url[0], collect);

  try {
    const settings = JSON.parse(await readFile(args.at(-1), "utf8"));
    return parseChromeFlags(settings.chromeFlags);
  } finally {
    cleanupFn();
  }
}

test("disables the Chromium sandbox only for GitHub Actions Lighthouse runs", async () => {
  assert.deepEqual(await effectiveChromeFlags("true"), ["--no-sandbox", "--headless=new"]);
  assert.deepEqual(await effectiveChromeFlags("false"), ["--headless=new"]);
  assert.deepEqual(await effectiveChromeFlags(undefined), ["--headless=new"]);
});
