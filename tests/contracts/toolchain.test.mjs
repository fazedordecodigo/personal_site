import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = async (relativePath) => readFile(new URL(relativePath, root), "utf8");

const expectedScripts = {
  test: "node --test tests/unit/*.test.mjs",
  "test:unit": "node --test tests/unit/*.test.mjs",
  "test:contracts": "node --test tests/contracts/*.test.mjs",
  "lint:js": "eslint scripts src/js tests --no-error-on-unmatched-pattern",
  "lint:css": "stylelint src/css/site.css",
  lint: "npm run lint:js && npm run lint:css",
  "build:snapshot": "node scripts/build-site.mjs --mode=snapshot",
  "build:remote": "node scripts/build-site.mjs --mode=remote-required",
  "snapshot:refresh": "node scripts/articles/snapshot.mjs",
  serve: "node scripts/serve.mjs public 4173",
  "browsers:install": "playwright install chromium firefox",
  "validate:html": "java -jar node_modules/vnu-jar/build/dist/vnu.jar --errors-only public/index.html",
  "check:artifact": "node scripts/check-artifact.mjs public",
  "test:browser": "playwright test --grep-invert @a11y",
  "test:a11y": "playwright test --grep @a11y",
  lighthouse: "node scripts/run-lighthouse.mjs",
  "verify:source": "npm run lint && npm run test:unit",
  "verify:artifact":
    "npm run test:contracts && npm run validate:html && npm run check:artifact && npm run test:browser && npm run test:a11y && npm run lighthouse",
  "verify:snapshot": "npm run verify:source && npm run build:snapshot && npm run verify:artifact",
  "verify:remote": "npm run verify:source && npm run build:remote && npm run verify:artifact",
  verify: "npm run verify:snapshot",
};

const expectedDevDependencies = {
  "@axe-core/playwright": "4.13.0",
  "@fontsource/inter": "5.3.0",
  "@fontsource/jetbrains-mono": "5.3.0",
  "@fontsource/space-grotesk": "5.3.0",
  "@lhci/cli": "0.15.1",
  "@playwright/test": "1.62.1",
  eslint: "10.8.1",
  parse5: "8.0.1",
  saxes: "6.0.0",
  stylelint: "17.14.1",
  "stylelint-config-standard": "40.0.0",
  "vnu-jar": "26.8.15",
  yaml: "2.9.0",
};

test("toolchain pins runtime, scripts, dependencies and generated-output ignores", async () => {
  assert.equal((await read(".nvmrc")).trim(), "22.23.2");
  assert.equal((await read(".java-version")).trim(), "21");

  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, "module");
  assert.deepEqual(packageJson.engines, { node: "22.23.2" });
  assert.deepEqual(packageJson.scripts, expectedScripts);
  assert.deepEqual(packageJson.devDependencies, expectedDevDependencies);

  const lock = JSON.parse(await read("package-lock.json"));
  assert.equal(lock.lockfileVersion, 3);
  assert.deepEqual(lock.packages[""].devDependencies, expectedDevDependencies);

  const gitignore = await read(".gitignore");
  for (const entry of [
    "/public/",
    "/build-report.json",
    "/playwright-report/",
    "/test-results/",
    "/.lighthouseci/",
    "/lhci_reports/",
  ]) {
    assert.match(gitignore, new RegExp(`^${entry.replaceAll("/", "\\/")}$`, "m"));
  }

  for (const version of Object.values(expectedDevDependencies)) {
    assert.doesNotMatch(version, /^[^0-9]/);
  }
});
