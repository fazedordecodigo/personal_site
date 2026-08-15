import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import test from "node:test";

const workflowText = await readFile(new URL("../../.github/workflows/site.yml", import.meta.url), "utf8");
const workflow = parse(workflowText);

const pins = {
  "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
  "actions/setup-node": "820762786026740c76f36085b0efc47a31fe5020",
  "actions/setup-java": "b6effb05e454b25005698d916606bdc6ffcbf961",
  "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
  "actions/download-artifact": "3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
  "Azure/static-web-apps-deploy": "1a947af9992250f3bc2e68ad0754c0b0c11566c9",
};

function walk(value, callback) {
  callback(value);
  if (Array.isArray(value)) for (const child of value) walk(child, callback);
  else if (value && typeof value === "object") for (const child of Object.values(value)) walk(child, callback);
}

function steps(job) {
  return job.steps ?? [];
}

function findStep(job, name) {
  return steps(job).find((step) => step.name === name);
}

test("declares the exact trusted events, inputs, runners and concurrency", () => {
  assert.deepEqual(workflow.on.pull_request.branches, ["main"]);
  assert.deepEqual(workflow.on.push.branches, ["main"]);
  assert.deepEqual(workflow.on.schedule, [{ cron: "17 12 * * *" }]);
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.deployment_target, {
    description: "Deployment target",
    required: true,
    default: "build-only",
    type: "choice",
    options: ["build-only", "preview", "production"],
  });
  assert.match(workflow["run-name"], /pr-\{0\}/);
  assert.match(workflow["run-name"], /build-only/);
  assert.match(workflow["run-name"], /preview/);
  assert.match(workflow["run-name"], /production/);
  assert.match(workflow.concurrency.group, /pull_request/);
  assert.match(workflow.concurrency.group, /site-external/);
  assert.match(String(workflow.concurrency["cancel-in-progress"]), /pull_request/);
  assert.deepEqual(Object.keys(workflow.jobs).sort(), ["deploy-preview", "deploy-production", "validate-and-build"].sort());
  for (const job of Object.values(workflow.jobs)) assert.equal(job["runs-on"], "ubuntu-24.04");
});

test("keeps validation secretless and runs the canonical gates once", () => {
  const validation = workflow.jobs["validate-and-build"];
  assert.deepEqual(validation.permissions, { contents: "read" });
  const validationText = JSON.stringify(validation);
  assert.doesNotMatch(validationText, /secrets\.|AZURE_STATIC_WEB_APPS/);
  assert.match(validationText, /actions\/checkout@[0-9a-f]{40}/);
  assert.match(validationText, /actions\/setup-node@[0-9a-f]{40}/);
  assert.match(validationText, /actions\/setup-java@[0-9a-f]{40}/);
  assert.match(validationText, /npm ci/);
  assert.match(validationText, /npm exec playwright install --with-deps chromium firefox/);
  assert.match(validationText, /npm run verify:snapshot/);
  assert.match(validationText, /npm run verify:remote/);
  const nodeSetup = findStep(validation, "Set up Node");
  assert.equal(nodeSetup.with["node-version-file"], ".nvmrc");
  const javaSetup = findStep(validation, "Set up Java");
  assert.equal(javaSetup.with.distribution, "temurin");
  assert.equal(String(javaSetup.with["java-version"]), "21");
  const report = findStep(validation, "Report BuildReport");
  assert.equal(report.if, "${{ always() }}");
  assert.match(report.run, /32768/);
  assert.match(report.run, /JSON\.parse/);
  assert.match(report.run, /expectedKeys/);
  for (const key of ["articleCount", "articleMode", "articleSource", "fallbackReasonCode", "outputFiles", "snapshotFetchedAt", "state", "status"]) {
    assert.match(report.run, new RegExp(key));
  }
  assert.match(report.run, /Number\.isInteger/);
  assert.match(report.run, /toISOString/);
  assert.match(report.run, /value\.includes\("\.\."\)/);
  assert.match(report.run, /A-Z0-9_/);
  assert.match(report.run, /appendFileSync/);
  assert.match(report.run, /BuildReport indisponível: falha anterior ao build\./);
  assert.match(report.run, /GITHUB_STEP_SUMMARY/);
  assert.doesNotMatch(report.run, /secrets\.|GH_TOKEN|response body|raw XML/);
  const manifest = findStep(validation, "Write artifact manifest");
  assert.match(manifest.run, /npm run check:artifact|scripts\/check-artifact\.mjs/);
  assert.equal(manifest.if, "${{ success() }}");
  const upload = findStep(validation, "Upload verified public artifact");
  assert.match(upload.uses, /actions\/upload-artifact@[0-9a-f]{40}$/);
  assert.equal(upload.if, "${{ success() }}");
  assert.equal(upload.with.path, "public");
});

test("pins every action to the reviewed full SHA and validates the freshness guard", () => {
  const uses = [];
  walk(workflow, (value) => {
    if (value && typeof value === "object" && typeof value.uses === "string") uses.push(value.uses);
  });
  for (const use of uses) {
    assert.match(use, /@[0-9a-f]{40}$/);
    const [owner, sha] = use.split("@");
    assert.equal(pins[owner], sha, use);
  }
  assert.deepEqual([...new Set(uses.map((use) => use.split("@")[0]))].sort(), Object.keys(pins).sort());
  for (const jobName of ["deploy-preview", "deploy-production"]) {
    const guard = findStep(workflow.jobs[jobName], "Freshness guard");
    assert.match(guard.run, /set -euo pipefail/);
    assert.equal(guard.env.GH_TOKEN, "${{ github.token }}");
    assert.match(guard.run, /gh api repos\/\$GITHUB_REPOSITORY\/git\/ref\/heads\/main --jq \.object\.sha/);
    assert.match(guard.run, /gh api "repos\/\$GITHUB_REPOSITORY\/actions\/workflows\/site\.yml\/runs\?branch=main&per_page=100"/);
    assert.match(guard.run, /pull_request/);
    assert.match(guard.run, /display_title/);
    assert.match(guard.run, /deploy_allowed=true/);
    assert.match(guard.run, /deploy_allowed=false/);
    assert.match(guard.run, /GITHUB_OUTPUT/);
  }
});

test("keeps preview and production deployment conditions isolated", () => {
  const preview = workflow.jobs["deploy-preview"];
  const production = workflow.jobs["deploy-production"];
  for (const job of [preview, production]) {
    assert.deepEqual(job.needs, "validate-and-build");
    assert.deepEqual(job.permissions, { contents: "read", actions: "read" });
    assert.match(job.if, /needs\.validate-and-build\.result == 'success'/);
    assert.match(job.if, /refs\/heads\/main/);
    assert.match(JSON.stringify(job), /actions\/download-artifact@[0-9a-f]{40}/);
    assert.match(JSON.stringify(job), /app_location["']?:["']? \/public|app_location/);
    assert.match(findStep(job, "Download verified artifact").if, /steps\.freshness\.outputs\.deploy_allowed == 'true'/);
    assert.match(findStep(job, job === preview ? "Deploy preview" : "Deploy production").if, /steps\.freshness\.outputs\.deploy_allowed == 'true'/);
  }
  assert.match(preview.if, /workflow_dispatch/);
  assert.match(preview.if, /deployment_target == 'preview'/);
  assert.match(preview.if, /PREVIEW_DEPLOY_ENABLED/);
  assert.equal(preview.environment.name, "preview");
  assert.equal(preview.environment.url, "${{ steps.deploy.outputs.static_web_app_url }}");
  const previewDeploy = findStep(preview, "Deploy preview");
  assert.equal(previewDeploy.id, "deploy");
  assert.equal(previewDeploy.with.deployment_environment, "qa");
  assert.equal(previewDeploy.with.app_location, "/public");
  assert.equal(previewDeploy.with.output_location, "");
  assert.equal(previewDeploy.with.skip_app_build, true);
  assert.match(previewDeploy.with.azure_static_web_apps_api_token, /secrets\.AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SMOKE_089E11B1E/);

  assert.match(production.if, /PRODUCTION_DEPLOY_ENABLED/);
  assert.match(production.if, /github\.event_name == 'push'/);
  assert.match(production.if, /github\.event_name == 'schedule'/);
  assert.match(production.if, /deployment_target == 'production'/);
  assert.equal(production.environment.name, "production");
  assert.equal(production.environment.url, "${{ steps.deploy.outputs.static_web_app_url }}");
  const productionDeploy = findStep(production, "Deploy production");
  assert.equal(productionDeploy.id, "deploy");
  assert.equal(productionDeploy.with.app_location, "/public");
  assert.equal(productionDeploy.with.output_location, "");
  assert.equal(productionDeploy.with.skip_app_build, true);
  assert.equal(productionDeploy.with.deployment_environment, undefined);
  assert.match(productionDeploy.with.azure_static_web_apps_api_token, /secrets\.AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SMOKE_089E11B1E/);
});

test("does not grant PR code deployment or mutate the repository", () => {
  assert.doesNotMatch(workflowText, /pull_request_target/);
  assert.doesNotMatch(workflowText, /npm install/);
  assert.doesNotMatch(workflowText, /git (commit|push)|gh pr/);
  assert.doesNotMatch(workflowText, />>\s*(src|\.github)\//);
  for (const jobName of ["deploy-preview", "deploy-production"]) {
    const jobText = JSON.stringify(workflow.jobs[jobName]);
    assert.doesNotMatch(jobText, /npm run verify|npm ci|setup-node|setup-java|checkout/);
    assert.match(jobText, /path["']?:["']? ?public/);
  }
  const secretReferences = workflowText.match(/secrets\.AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SMOKE_089E11B1E/g) ?? [];
  assert.equal(secretReferences.length, 2);
});
