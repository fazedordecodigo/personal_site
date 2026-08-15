# Personal Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy personal site with the approved one-page static site, a safe build-time Substack snapshot, a privacy-minimizing deferred third-party embed, executable quality gates, and an Azure Static Web Apps artifact.

**Architecture:** A Node build layer validates either a versioned snapshot or the fixed official RSS endpoint, exposes only a small `FeedResult` to a context-escaping renderer, and recreates an allowlisted `public/` artifact. The browser receives semantic HTML, one local CSS file, one tiny local deferred script used only for the Substack iframe, local fonts, and the approved portrait. One GitHub Actions workflow validates the same artifact without secrets in PRs and deploys it only from trusted events after every gate passes.

**Tech Stack:** Node.js 22.23.2, ECMAScript modules, Node test runner, saxes, parse5, ESLint, Stylelint, Nu HTML Checker, Playwright, axe-core, Lighthouse CI, GitHub Actions, Azure Static Web Apps.

## Global Constraints

- The canonical product contract is [the consolidated specification](../../specs/2026-08-15-personal-site.md).
- The durable visual contract is [the approved design reference](../../reference/2026-08-15-personal-site-design-reference.md). A clean checkout must not depend on `.superpowers/` or a Codex visualization directory.
- Q13 approved the specification on 2026-08-15. This plan is eligible for a future implementation task, but the approval does not itself start implementation or authorize preview, deploy or publication.
- Preserve all unrelated user changes. Before every commit, inspect `git status --short` and stage only files owned by the current task.
- Do not commit `public/`, `build-report.json`, Playwright output, Lighthouse output, credentials, raw RSS XML, request payloads, or cookies.
- Do not deploy, create an Azure preview, alter DNS, or send a real Substack submission without separate human authorization.
- Every behavioral change starts with a failing automated test. Record the expected failure before writing production code.
- Run the task-specific gate and the accumulated regression suite before each commit.
- Keep the approved photo byte-identical. Do not reference or ship the unused Cursor/Devin cover PNGs from the prototype directory.
- Never import code, inline styles, the prototype banner, the state switcher, `?state=`, or `noindex` from the prototype.
- Use `apply_patch` for hand-authored source changes. Commands that generate a lockfile, snapshot, report, or screenshot may write their documented output.
- Use exact dependency versions in `package.json` and `package-lock.json`; use full 40-character SHAs for GitHub Actions.
- Tasks 8 and 9 are one merge boundary: keep both commits local until the replacement workflow exists and its contract passes; never push or merge the Task 8 deletion by itself.

## Dependency graph

```text
Task 1 toolchain
  └─ Task 2 feed parser
       └─ Task 3 loader and snapshot
            └─ Task 4 renderer and semantic page
                 └─ Task 5 visual system and assets
                      └─ Task 6 click-to-load embed
                           └─ Task 7 artifact, security and SEO gates
                                └─ Task 8 legacy removal
                                     └─ Task 9 CI and Azure workflow
                                          └─ Task 10 complete local verification
                                               └─ Task 11 authorized preview and launch gates
```

Task 6 starts only after Task 5 is committed because both tasks update the template and build/copy seams. Task 5 owns CSS, fonts, the portrait and visual tests; Task 6 then owns the iframe script, iframe markup fragment and embed tests.

---

## Task 1: Establish the deterministic build and test shell

**Files:**

- Create: `.nvmrc`
- Create: `.java-version`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `eslint.config.mjs`
- Create: `stylelint.config.mjs`
- Create: `playwright.config.mjs`
- Create: `lighthouserc.cjs`
- Create: `tests/contracts/toolchain.test.mjs`
- Create: `tests/unit/serve.test.mjs`
- Create: `scripts/serve.mjs`
- Modify: `.gitignore`

### Interface fixed by this task

`package.json` must be private, use ESM, require Node 22.23.2, and expose these stable commands:

```json
{
  "private": true,
  "type": "module",
  "engines": { "node": "22.23.2" },
  "scripts": {
    "test": "node --test tests/unit",
    "test:unit": "node --test tests/unit",
    "test:contracts": "node --test tests/contracts",
    "lint:js": "eslint scripts src/js tests --no-error-on-unmatched-pattern",
    "lint:css": "stylelint src/css/site.css",
    "lint": "npm run lint:js && npm run lint:css",
    "build:snapshot": "node scripts/build-site.mjs --mode=snapshot",
    "build:remote": "node scripts/build-site.mjs --mode=remote-required",
    "snapshot:refresh": "node scripts/articles/snapshot.mjs",
    "serve": "node scripts/serve.mjs public 4173",
    "browsers:install": "playwright install chromium firefox",
    "validate:html": "java -jar node_modules/vnu-jar/build/dist/vnu.jar --errors-only public/index.html",
    "check:artifact": "node scripts/check-artifact.mjs public",
    "test:browser": "playwright test --grep-invert @a11y",
    "test:a11y": "playwright test --grep @a11y",
    "lighthouse": "node scripts/run-lighthouse.mjs",
    "verify:source": "npm run lint && npm run test:unit",
    "verify:artifact": "npm run test:contracts && npm run validate:html && npm run check:artifact && npm run test:browser && npm run test:a11y && npm run lighthouse",
    "verify:snapshot": "npm run verify:source && npm run build:snapshot && npm run verify:artifact",
    "verify:remote": "npm run verify:source && npm run build:remote && npm run verify:artifact",
    "verify": "npm run verify:snapshot"
  }
}
```

The script names are a cross-task API. Later tasks may fill missing target files but must not silently rename these commands.

### Steps

- [ ] Write `tests/contracts/toolchain.test.mjs` first. Assert `.nvmrc` is exactly `22.23.2`, `.java-version` is exactly `21`, `package.json` is private/ESM, every command above exists, `/public/`, `/build-report.json`, `/playwright-report/`, `/test-results/`, `/.lighthouseci/` and `/lhci_reports/` are ignored, and no dependency range starts with `^`, `~`, `>`, `<` or `*`. Compare the complete `devDependencies` map to the exact package/version set in the install command below, reject missing or additional entries, and require `package-lock.json`'s root package entry to mirror that same map.
- [ ] Run `node --test tests/contracts/toolchain.test.mjs` and record the expected failure caused by the missing toolchain files.
- [ ] Write `tests/unit/serve.test.mjs` before the server. Against a temporary root and ephemeral port, assert GET/HEAD of an allowlisted file, explicit HTML/CSS/JS/JSON/XML/WOFF2/JPEG MIME types, 404 for unknown paths, 405 for unsupported methods, and rejection of plain/percent-encoded traversal, NUL, outside-root symlinks and malformed URLs. Assert the listener binds only `127.0.0.1` and closes cleanly after every test.
- [ ] Run `node --test tests/unit/serve.test.mjs` and record the expected missing-module failure.
- [ ] Create `.nvmrc`, `.java-version`, the minimal `package.json`, configs and `scripts/serve.mjs`. Export `createStaticServer({ root })` and keep the CLI wrapper separate. Resolve/realpath the root once, use `lstat` plus containment for each request, never follow a symlink, bind to `127.0.0.1`, map MIME types explicitly and return the tested statuses.
- [ ] Install exact build/test dependencies and generate the lockfile:

```bash
npm install --save-dev --save-exact @axe-core/playwright@4.13.0 @fontsource/inter@5.3.0 @fontsource/jetbrains-mono@5.3.0 @fontsource/space-grotesk@5.3.0 @lhci/cli@0.15.1 @playwright/test@1.62.1 eslint@10.8.1 parse5@8.0.1 saxes@6.0.0 stylelint@17.14.1 stylelint-config-standard@40.0.0 vnu-jar@26.8.15 yaml@2.9.0
```

  These versions are the npm registry snapshot taken on 2026-08-15. Do not silently refresh them during implementation; a version change requires its own reviewed dependency update.

- [ ] Run `npm ci` in a clean temporary copy or after removing only the local `node_modules/`; confirm the lockfile is sufficient and `git status` does not include generated reports.
- [ ] Run `node --test tests/contracts/toolchain.test.mjs tests/unit/serve.test.mjs`; expect pass.
- [ ] Run `npm run lint:js`; expect pass for the files that exist at this stage.
- [ ] Commit only this task:

```bash
git add .nvmrc .java-version package.json package-lock.json eslint.config.mjs stylelint.config.mjs playwright.config.mjs lighthouserc.cjs scripts/serve.mjs tests/contracts/toolchain.test.mjs tests/unit/serve.test.mjs .gitignore
git commit -m "build: establish deterministic site toolchain"
```

---

## Task 2: Implement the hostile-input feed parser

**Files:**

- Create: `scripts/articles/constants.mjs`
- Create: `scripts/articles/parse-feed.mjs`
- Create: `tests/unit/parse-feed.test.mjs`
- Create: `tests/fixtures/feed-valid.xml`
- Create: `tests/fixtures/feed-empty.xml`
- Create: `tests/fixtures/feed-malformed.xml`
- Create: `tests/fixtures/feed-malicious-dtd.xml`
- Create: `tests/fixtures/feed-duplicates.xml`
- Create: `tests/fixtures/feed-invalid-fields.xml`

### Public module contract

```js
export const FEED_URL = "https://fazedordecodigo.substack.com/feed";
export const TIME_ZONE = "America/Sao_Paulo";
export const MAX_FEED_BYTES = 1_048_576;
export const TITLE_LIMIT = 160;
export const EXCERPT_LIMIT = 240;

export function parseFeed(xmlText) {
  // Returns ParseFeedResult or throws FeedContractError.
}

ParseFeedResult = {
  articles: Article[3],
  diagnostics: {
    totalItems: number,
    acceptedBeforeLimit: number,
    discardedByCode: {
      FIELD_INVALID: number,
      URL_FORBIDDEN: number,
      DATE_INVALID: number,
      DUPLICATE_CONFLICT: number,
      DUPLICATE_IDENTICAL: number
    }
  }
}

export class FeedContractError extends Error {
  constructor(code, message) {}
}
```

Thrown error codes are `DTD_FORBIDDEN`, `XML_INVALID` and `ITEMS_INSUFFICIENT`. Item-level problems are counted in `diagnostics` and do not block a feed that still has at least three valid unique items.

### Steps

- [ ] Write fixtures with: at least six valid items out of order; an empty channel; malformed XML; `DOCTYPE` plus entity declarations; identical and conflicting duplicate `guid`; dangerous protocols/hosts; an invalid date; HTML and entities in descriptions; and strings longer than both limits. Valid fixture links use the required host with invented `/p/fixture-*` paths; fixture GUIDs use `urn:fixture:*`. Never copy emails, real article copy or the raw feed.
- [ ] Write `tests/unit/parse-feed.test.mjs` before implementation. Assert the exact `Article` keys; title/excerpt NFC plus collapsed whitespace; `id` as `guid` normalized to NFC with edge whitespace removed and internal whitespace preserved; text extraction through parse5; one-time entity decoding; code-point truncation; URL cleanup; deterministic eyebrow; descending date order with normalized-ID lexicographic tie-break; diagnostics; and exactly three results.
- [ ] Assert snapshots contain three normalized, unique IDs; an invalid individual item is discarded without blocking three later valid items; identical duplicates collapse by normalized ID; conflicting duplicates discard their whole normalized-ID group; fewer than three remaining items throws only `ITEMS_INSUFFICIENT`.
- [ ] Assert the parser never includes `content:encoded`, `enclosure`, creator, email or raw HTML in serialized output.
- [ ] Run `node --test tests/unit/parse-feed.test.mjs`; record the expected module-not-found failure.
- [ ] Implement `constants.mjs` and `parse-feed.mjs` with saxes configured without external entity resolution. Reject case-insensitive `<!DOCTYPE` and `<!ENTITY` before parsing. Use `parse5.parseFragment()` and recursive text extraction for the description; do not strip HTML with a regular expression. Return only numeric diagnostics, never rejected values.
- [ ] Implement URL validation with `new URL()`: exact protocol/hostname, empty credentials/port, `/p/` prefix, and cleared `search`/`hash`.
- [ ] Freeze each `Article` and the returned array so later layers cannot mutate validated data.
- [ ] Run:

```bash
node --test tests/unit/parse-feed.test.mjs
npm run lint:js
```

  Expect both commands to pass.
- [ ] Commit only this task:

```bash
git add scripts/articles/constants.mjs scripts/articles/parse-feed.mjs tests/unit/parse-feed.test.mjs tests/fixtures
git commit -m "feat: validate and normalize Substack feed"
```

---

## Task 3: Add HTTP policy, snapshot validation and durable deploy behavior

**Files:**

- Create: `scripts/articles/load-articles.mjs`
- Create: `scripts/articles/snapshot.mjs`
- Create: `tests/unit/load-articles.test.mjs`
- Create: `tests/unit/snapshot.test.mjs`
- Create: `content/articles.snapshot.json`

### Public module contract

```js
export async function loadArticles({
  mode,
  snapshotPath,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
}) {
  // Promise<FeedResult>; mode is "snapshot" or "remote-required".
}

export async function readSnapshot({ snapshotPath, now = () => new Date() }) {
  // Promise<FeedResult>; validates schema and returns source "snapshot".
}

export async function fetchRemoteSnapshot({
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
}) {
  // Promise<{ snapshot: ArticleSnapshot, feedResult: FeedResult }>.
}

export async function writeSnapshotAtomic(snapshot, destination) {
  // Writes a sibling temporary file, fsyncs, then renames atomically.
}
```

Additional exported errors:

```js
export class FeedFetchError extends Error {
  constructor(code, message, options = {}) {}
}
```

Allowed fetch codes are `TIMEOUT`, `NETWORK`, `HTTP_STATUS`, `CONTENT_TYPE`, `BODY_TOO_LARGE`, `REDIRECT_FORBIDDEN` and `REMOTE_CONTRACT`.

### Steps

- [ ] Write `load-articles.test.mjs` first with injected fake fetch, clock and sleep. Cover: snapshot mode performs zero fetches; schema version mismatch; invalid `fetchedAt`; stale at 48 hours plus 1 ms but not at exactly 48 hours; status 200/type validation; `Content-Length`; streamed overflow; timeout at 8 seconds; maximum three validated redirects; fixed 500 ms retry; two attempts only for network, timeout, 429 and 5xx; no retry for malformed XML or forbidden redirects.
- [ ] Assert `remote-required` throws on every remote failure and never falls back to the repository snapshot. This is what prevents replacing the valid Azure deployment.
- [ ] Write `snapshot.test.mjs` first. Assert the temporary file is on the same directory, the destination is unchanged on validation/write failure, and success leaves one valid final JSON file with a trailing newline and no temporary file.
- [ ] Run both test files and record the expected missing-module failures.
- [ ] Implement manual redirect handling with `redirect: "manual"`; validate every `Location` before following it. Stream the decompressed body and stop at 1,048,576 bytes.
- [ ] Implement retry with an injected promise-based sleep adapter. Never log body content; error messages include only code, status and approved hostname.
- [ ] Implement snapshot schema validation without coercion. Require exactly the keys and exactly three valid articles.
- [ ] Create the initial real snapshot by running `npm run snapshot:refresh` after obtaining the normal network authorization required by the environment. Review that it contains exactly three items from the fixed feed and only the approved fields.
- [ ] Run:

```bash
node --test tests/unit/load-articles.test.mjs tests/unit/snapshot.test.mjs
npm run test:unit
npm run lint:js
```

  Expect pass and no untracked raw XML.
- [ ] Commit only this task:

```bash
git add scripts/articles/load-articles.mjs scripts/articles/snapshot.mjs tests/unit/load-articles.test.mjs tests/unit/snapshot.test.mjs content/articles.snapshot.json
git commit -m "feat: materialize validated article snapshots"
```

---

## Task 4: Build the semantic page and safe renderer

**Files:**

- Create: `src/index.template.html`
- Create: `src/robots.txt`
- Create: `src/sitemap.xml`
- Create: `scripts/render-site.mjs`
- Create: `scripts/build-site.mjs`
- Create: `scripts/static-assets.mjs`
- Create: `scripts/copy-static-assets.mjs`
- Create: `tests/unit/render-site.test.mjs`
- Create: `tests/unit/build-site.test.mjs`
- Create: `tests/contracts/content.test.mjs`
- Create: `tests/contracts/semantic-html.test.mjs`

### Renderer contract

The template has one and only one token:

```html
<!-- ARTICLES_SLOT -->
```

The modules expose:

```js
export function escapeHtmlText(value) {}
export function escapeHtmlAttribute(value) {}
export function renderArticles(feedResult) {}
export function renderSite({ template, feedResult }) {}
export async function buildSite({
  articleMode,
  outputDir = "public",
  workspaceRoot = process.cwd(),
  now = () => new Date(),
  fetchImpl = globalThis.fetch,
  fsImpl = nodeFsAdapter
}) {
  // Promise<BuildReport>
}
```

`BuildReport` is the same JSON-serializable union defined in the specification:

```js
BuildReport =
  | {
      status: "built",
      articleMode: "snapshot" | "remote-required",
      state: "fresh" | "stale",
      articleSource: "remote" | "snapshot",
      articleCount: 3,
      snapshotFetchedAt: string,
      outputFiles: string[],
      fallbackReasonCode: null | "SNAPSHOT_STALE"
    }
  | {
      status: "blocked",
      articleMode: "snapshot" | "remote-required",
      state: "refresh-error" | "empty",
      articleSource: "remote" | "snapshot",
      articleCount: 0,
      snapshotFetchedAt: null,
      outputFiles: [],
      fallbackReasonCode:
        | "TIMEOUT"
        | "NETWORK"
        | "HTTP_STATUS"
        | "CONTENT_TYPE"
        | "BODY_TOO_LARGE"
        | "REDIRECT_FORBIDDEN"
        | "REMOTE_CONTRACT"
        | "SNAPSHOT_INVALID"
    }
```

### Steps

- [ ] Write renderer tests first. Use hostile titles/excerpts containing `<`, `>`, `&`, both quote types and a closing tag. Assert contextual escaping, three articles, ISO `datetime`, permitted URLs only, and no remote value in an attribute name, tag name, raw HTML or CSS. For `2026-08-13T00:48:38Z`, assert card text `12 ago. 2026`; for capture `2026-08-15T12:17:00Z`, assert `Última atualização: 15/08/2026 às 09:17 (America/Sao_Paulo).`. At exactly 48 hours assert no warning; at 48 hours plus 1 ms assert `Conteúdo preservado; a última atualização tem mais de 48 horas.`.
- [ ] Write `build-site.test.mjs` first. A successful snapshot build writes the `built` union member; an invalid/missing snapshot writes `empty`; an injected remote failure writes `refresh-error`. Both blocked cases use zero article/output counts, preserve the prior `public/` byte-for-byte and exit nonzero without invoking the renderer.
- [ ] In the same build tests, reject `outputDir` values `""`, `"."`, the workspace root, `/`, any path outside `workspaceRoot`, any symlink and any directory whose real parent escapes the workspace. Inject render, copy, rename and cleanup failures one at a time; every failure must leave the prior `public/` byte-identical and leave no `.public.tmp-*` or `.public.backup-*` sibling.
- [ ] Test a successful swap with an existing artifact: build into a same-filesystem sibling temp directory, rename the prior artifact to a sibling backup, promote temp, remove backup, and leave a sorted `BuildReport`. If promotion fails after backup, restore the backup before returning nonzero.
- [ ] Write content contract tests containing every exact approved navigation, brand/header, hero, profile, proof, article-section, newsletter and footer string plus every canonical static URL and forbidden claim from the specification. Keep feed-derived titles/excerpts/dates outside this static-copy test. Assert the CTA `Vamos conversar` has the literal LinkedIn URL, not `#contato`.
- [ ] Assert both isolated official titles, `Cursor Ambassador` and `Devin Ambassador`, carry `lang="en"`; surrounding PT-BR copy must not be mislabeled.
- [ ] Write semantic tests for `lang="pt-BR"`, skip link, named nav, landmarks, section labels, exactly one H1, heading order, unique IDs, non-empty links, absence of inline style/handlers/scripts and absence of prototype/legacy tokens.
- [ ] Run the renderer, build and contract files; record failure because the renderer/template/build modules do not exist.
- [ ] Create the template with semantic HTML and all static approved copy. Use only the single article slot for generated markup. Do not copy prototype-only explanatory text.
- [ ] Add exact metadata from specification section 15, `robots.txt` and the one-URL sitemap. Do not add JSON-LD, `keywords`, `noindex`, a manifest or analytics.
- [ ] Implement both escape functions explicitly. `renderArticles()` may join trusted template literals only after every remote value has passed the correct escape function; it must not emit article images.
- [ ] Define the initial frozen `STATIC_COPY_MANIFEST` in `static-assets.mjs` with `src/robots.txt → robots.txt` and `src/sitemap.xml → sitemap.xml`. Implement `copy-static-assets.mjs` with `lstat`, source/destination containment, symlink rejection and explicit file copies; it is the only generic source-to-output copy seam.
- [ ] Implement `buildSite()` with the tested output-root guard and injected filesystem adapter. Create a sibling temporary output directory, render/copy into it, and replace `public/` only after success. On success or error, atomically write the sanitized union member to `build-report.json`; on error, restore/leave the existing `public/` untouched and return a nonzero CLI exit.
- [ ] Run:

```bash
node --test tests/unit/render-site.test.mjs tests/unit/build-site.test.mjs tests/contracts/content.test.mjs tests/contracts/semantic-html.test.mjs
npm run build:snapshot
npm run validate:html
```

  Expect zero test failures and zero Nu errors. The page is not expected to match the visual design until Task 5.
- [ ] Commit only this task:

```bash
git add src/index.template.html src/robots.txt src/sitemap.xml scripts/render-site.mjs scripts/build-site.mjs scripts/static-assets.mjs scripts/copy-static-assets.mjs tests/unit/render-site.test.mjs tests/unit/build-site.test.mjs tests/contracts/content.test.mjs tests/contracts/semantic-html.test.mjs
git commit -m "feat: render approved semantic personal page"
```

---

## Task 5: Reproduce the approved visual system with local assets

**Files:**

- Create: `src/css/site.css`
- Create: `src/assets/images/emerson-delatorre.jpg`
- Create: `src/assets/fonts/space-grotesk-latin-700-normal.woff2`
- Create: `src/assets/fonts/inter-latin-400-normal.woff2`
- Create: `src/assets/fonts/inter-latin-600-normal.woff2`
- Create: `src/assets/fonts/jetbrains-mono-latin-500-normal.woff2`
- Create: `src/assets/fonts/jetbrains-mono-latin-700-normal.woff2`
- Create: `src/assets/fonts/LICENSES.md`
- Create: `src/assets/fonts/OFL-1.1.txt`
- Create: `tests/contracts/assets.test.mjs`
- Create: `tests/browser/responsive.spec.mjs`
- Create: `tests/browser/visual.spec.mjs`
- Modify: `scripts/build-site.mjs`
- Modify: `scripts/static-assets.mjs`
- Modify: `scripts/copy-static-assets.mjs`
- Modify: `src/index.template.html`
- Modify: `playwright.config.mjs`

### Asset contract

- Portrait SHA-256: `63fb6bdb780c1c3f44fa9e4b2f62dea91f0795427fed85c9b65d3c93eba62ecd`.
- Portrait dimensions: 400 × 400; browser display never exceeds 400 CSS px in either dimension.
- Font files copied from exact locked Fontsource packages:
  - `space-grotesk-latin-700-normal.woff2`;
  - `inter-latin-400-normal.woff2`;
  - `inter-latin-600-normal.woff2`;
  - `jetbrains-mono-latin-500-normal.woff2`;
  - `jetbrains-mono-latin-700-normal.woff2`.
- CSS references only these local WOFF2 files and declares `font-display: swap`.

After this task, the frozen manifest adds these exact mappings:

```text
src/css/site.css → css/site.css
src/assets/images/emerson-delatorre.jpg → assets/images/emerson-delatorre.jpg
src/assets/fonts/space-grotesk-latin-700-normal.woff2 → assets/fonts/space-grotesk-latin-700-normal.woff2
src/assets/fonts/inter-latin-400-normal.woff2 → assets/fonts/inter-latin-400-normal.woff2
src/assets/fonts/inter-latin-600-normal.woff2 → assets/fonts/inter-latin-600-normal.woff2
src/assets/fonts/jetbrains-mono-latin-500-normal.woff2 → assets/fonts/jetbrains-mono-latin-500-normal.woff2
src/assets/fonts/jetbrains-mono-latin-700-normal.woff2 → assets/fonts/jetbrains-mono-latin-700-normal.woff2
src/assets/fonts/LICENSES.md → assets/fonts/LICENSES.md
src/assets/fonts/OFL-1.1.txt → assets/fonts/OFL-1.1.txt
```

### Steps

- [ ] Copy `/home/madruga/Imagens/eu.jpg` to `src/assets/images/emerson-delatorre.jpg`, then run `sha256sum` and an image-dimension probe. Stop if either value differs from the contract.
- [ ] Copy each named WOFF2 from the matching `node_modules/@fontsource/<family>/files/` path to the exact `src/assets/fonts/` filename. Copy the OFL 1.1 license text from a locked package to `OFL-1.1.txt`; create `LICENSES.md` recording every package name, exact lockfile version, upstream project, SPDX `OFL-1.1` and the shared license file. Do not download fonts outside `npm ci`.
- [ ] Write `assets.test.mjs` first. Assert the portrait hash/dimensions, exact font allowlist, each committed WOFF2 SHA equals its locked package source, each package declares `OFL-1.1`, both license files exist, local font URLs, no remote font URL, no article `<img>`, one content `<img>`, explicit dimensions, `fetchpriority="high"` and absence of portrait lazy-load.
- [ ] Write responsive tests first for 320, 480, 481, 768 and 1440 px plus a 160 CSS px reflow fixture. Assert `scrollWidth === clientWidth`, no clipped text/CTA, controls at least 44 px, logical stacking and portrait size. Assert the nav remains available at all widths.
- [ ] Write visual-contract tests first for hero, profile, articles, newsletter and footer at 320, 768 and 1440 px. Assert the durable design-reference tokens, column counts, spacing rhythm, portrait geometry and CTA hierarchy; save diagnostic screenshots only in ignored test output. Do not depend on the discarded prototype or its switcher.
- [ ] Provision the two locked Playwright browser builds locally with `npm exec playwright install chromium firefox`. System-package installation, if the host needs it, requires the environment's normal approval before adding `--with-deps`.
- [ ] Run the new tests against the unstyled page and record their expected failures.
- [ ] Implement `site.css` with the exact color tokens, 8 px spacing rhythm, 1160 px maximum container, approved typography, borders, radii, focus ring and reduced-motion rules. Keep specificity shallow and do not add a preprocessor.
- [ ] Extend `STATIC_COPY_MANIFEST` with the exact CSS/image/font/license mappings above. Keep `copy-static-assets.mjs` generic and make `buildSite()` consume this single manifest before the atomic output swap.
- [ ] Keep the portrait as the hero focus with `object-position` verified against the real face. Do not upscale, create a social composite, import cover PNGs or add article image slots.
- [ ] Run:

```bash
npm run lint:css
node --test tests/contracts/assets.test.mjs
npm run build:snapshot
npm run test:browser -- tests/browser/responsive.spec.mjs tests/browser/visual.spec.mjs
```

  Expect pass after approving only pixel changes that match the already approved direction.
- [ ] Commit only this task:

```bash
git add src/css/site.css src/assets scripts/static-assets.mjs scripts/copy-static-assets.mjs scripts/build-site.mjs src/index.template.html tests/contracts/assets.test.mjs tests/browser/responsive.spec.mjs tests/browser/visual.spec.mjs playwright.config.mjs
git commit -m "feat: apply approved responsive visual system"
```

---

## Task 6: Implement the Substack click-to-load boundary

**Files:**

- Create: `src/js/substack-embed.js`
- Create: `tests/browser/substack-embed.spec.mjs`
- Modify: `src/index.template.html`
- Modify: `scripts/static-assets.mjs`
- Modify: `scripts/copy-static-assets.mjs`
- Modify: `scripts/build-site.mjs`

### DOM contract

Required identifiers and attributes:

```html
<button id="load-substack" type="button">Carregar formulário do Substack</button>
<div id="mobile-embed-message" role="status" tabindex="-1"></div>
<div id="iframe-panel" aria-busy="false" hidden>
  <p id="iframe-status" role="status" aria-live="polite" tabindex="-1"></p>
  <iframe
    id="substack-frame"
    data-src="https://fazedordecodigo.substack.com/embed"
    data-timeout-ms="12000"
    title="Inscrição na newsletter Fazedor de Código"
    width="480"
    height="320"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    aria-describedby="iframe-status"
  ></iframe>
</div>
```

The template loads exactly one local script with `src="/js/substack-embed.js"` and `defer`. No inline bootstrap data or global test switches are allowed.

### Steps

- [ ] Write Playwright tests first and intercept all requests to `fazedordecodigo.substack.com`. At 1440 and 481 px, assert zero request and no iframe `src` before a real click; query strings, scroll, hover, focus, Tab and Enter on unrelated controls must not activate it.
- [ ] Assert a button click or Enter/Space on the focused button assigns the exact URL once, issues one document request, changes `aria-busy`, moves focus to status, and never hides the external link.
- [ ] Assert the loading text is exactly `Solicitação enviada ao Substack. Se a área abaixo não funcionar, use Assinar no Substack.`
- [ ] Fulfill the intercepted iframe request with deterministic HTML and assert the load text is exactly `O navegador concluiu a navegação do iframe, mas esta página não consegue confirmar o conteúdo interno nem a inscrição.` Do not assert form content or subscription success.
- [ ] Keep the intercepted frame route pending and use Playwright Clock to exercise timeout; do not abort the request because a browser may still emit `load` for an error document. Modify only the served test HTML from `data-timeout-ms="12000"` to `data-timeout-ms="25"`; production source remains 12000. For missing, zero, negative and nonnumeric values, advance 12,001 ms to prove the safe 12000 ms fallback without a real wait. Assert `aria-busy="false"`, the exact live-region text `Não foi possível confirmar o carregamento do formulário. Use Assinar no Substack.`, a visibly highlighted/usable external link, and no asynchronous focus move; focus remains where the user left it and never falls to `body`.
- [ ] At 320 and 480 px, assert the button/facade/iframe are unavailable, the mobile message and external link are visible, and zero Substack request occurs. At 481 px, assert activation is available and the frame has at least 320 px internal width.
- [ ] Run the embed spec and record expected failures before the script exists.
- [ ] Implement a strict IIFE in `substack-embed.js`. Read only known IDs/data attributes, guard missing nodes, parse a finite positive integer timeout with a hard fallback of 12000 ms, check `matchMedia("(min-width: 481px)")` immediately before activation, set `src` once, clear the timeout on `load`, and never call `fetch`, `innerHTML`, `postMessage` or storage APIs.
- [ ] Add the literal manifest mapping `src/js/substack-embed.js → js/substack-embed.js`; do not discover scripts by glob.
- [ ] Add a media-query listener that updates the initial facade/mobile message while no iframe has been requested. Once requested, do not unload the cross-origin document; ensure resize does not create page overflow or move focus to `body`.
- [ ] Run:

```bash
npm run lint:js
npm run build:snapshot
npm run test:browser -- tests/browser/substack-embed.spec.mjs
```

  Expect pass and exactly one parent-initiated navigation to the approved `/embed` URL only in activated desktop cases. Inventory, but do not globally restrict or miscount, the frame's own cross-origin subrequests and cookies.
- [ ] Commit only this task:

```bash
git add src/js/substack-embed.js src/index.template.html scripts/static-assets.mjs scripts/copy-static-assets.mjs scripts/build-site.mjs tests/browser/substack-embed.spec.mjs
git commit -m "feat: add explicit Substack embed activation"
```

---

## Task 7: Enforce artifact, security, accessibility and SEO contracts

**Files:**

- Create: `staticwebapp.config.json`
- Create: `scripts/check-artifact.mjs`
- Create: `tests/contracts/artifact.test.mjs`
- Create: `tests/contracts/security.test.mjs`
- Create: `tests/contracts/seo.test.mjs`
- Create: `tests/browser/a11y.spec.mjs`
- Create: `tests/browser/keyboard.spec.mjs`
- Create: `tests/browser/network.spec.mjs`
- Create: `scripts/run-lighthouse.mjs`
- Modify: `scripts/build-site.mjs`
- Modify: `scripts/static-assets.mjs`
- Modify: `lighthouserc.cjs`

### Artifact allowlist

`check-artifact.mjs public` accepts only:

```text
index.html
robots.txt
sitemap.xml
staticwebapp.config.json
css/site.css
js/substack-embed.js
assets/images/emerson-delatorre.jpg
assets/fonts/LICENSES.md
assets/fonts/OFL-1.1.txt
assets/fonts/space-grotesk-latin-700-normal.woff2
assets/fonts/inter-latin-400-normal.woff2
assets/fonts/inter-latin-600-normal.woff2
assets/fonts/jetbrains-mono-latin-500-normal.woff2
assets/fonts/jetbrains-mono-latin-700-normal.woff2
```

It emits a sorted JSON manifest with path, bytes and SHA-256, and exits nonzero for a missing or extra file.

### Steps

- [ ] Write artifact tests first for extra files, missing files, symlinks, path escapes, source maps, gzip budgets and initial transfer budget. Assert CSS ≤20 KiB gzip and JS ≤5 KiB gzip. Add a sixth arbitrary `.woff2` and prove the literal allowlist rejects it.
- [ ] Write security tests first. Parse built HTML/config structurally: inspect `script`, `link`, `iframe`, `img`, resource URLs and event/style attributes, plus authored JS sinks; never perform a forbidden-word search over editorial text. Assert no inline code/style, forbidden resource origin/dependency/sink, wildcard or `unsafe-*`; assert the exact CSP and the four other headers from specification section 13; assert one third-party iframe maximum and no initial `src`.
- [ ] Write SEO tests first. Assert exact title/description/canonical, complete coherent OG/Twitter fields, 400 × 400 local social image, no `noindex`, `keywords` or JSON-LD, permissive robots, one canonical sitemap URL and three crawlable article links in initial HTML.
- [ ] Write `a11y.spec.mjs` tagged `@a11y`. Run axe on every section at 320, 480, 481, 768 and 1440; fail on critical or serious violations. Check color pairs, focus ring, reduced motion, 44 px targets and accessibility names.
- [ ] Write keyboard/network specs. Verify the exact Tab sequence, skip-link behavior, no traps, blocked iframe fallback and zero third-party requests before activation. After activation, assert one navigation initiated by the parent to the exact `/embed` URL and inventory the iframe's internal subrequests separately.
- [ ] Run the tests and record expected failures for the missing checker/config.
- [ ] Implement `staticwebapp.config.json` with the exact blocking headers. Do not add a SPA navigation fallback.
- [ ] Add the literal manifest mapping `staticwebapp.config.json → staticwebapp.config.json` and assert the built copy is byte-identical to the source.
- [ ] Implement the checker using `lstat`, realpath containment, streaming SHA-256 and gzip size. Never follow a symlink.
- [ ] Configure Lighthouse CI for three runs with assertions: Performance ≥0.90, Accessibility =1.00, Best Practices ≥0.95, SEO =1.00, LCP ≤2500 ms, CLS ≤0.1 and TBT ≤200 ms. Implement `run-lighthouse.mjs` to obtain the locked Playwright Chromium executable path, set `CHROME_PATH`, spawn the local LHCI binary and propagate its exit code.
- [ ] Run:

```bash
npm run build:snapshot
npm run validate:html
npm run check:artifact
npm run test:contracts
npm run test:browser
npm run test:a11y
npm run lighthouse
```

  Expect all automatic gates to pass. Record that automation is not a full WCAG declaration.
- [ ] Commit only this task:

```bash
git add staticwebapp.config.json scripts/check-artifact.mjs scripts/build-site.mjs scripts/static-assets.mjs scripts/run-lighthouse.mjs tests/contracts/artifact.test.mjs tests/contracts/security.test.mjs tests/contracts/seo.test.mjs tests/browser/a11y.spec.mjs tests/browser/keyboard.spec.mjs tests/browser/network.spec.mjs lighthouserc.cjs
git commit -m "test: enforce site quality and security gates"
```

---

## Task 8: Remove the legacy runtime after the replacement passes

**Files:**

- Create: `tests/contracts/no-legacy.test.mjs`
- Delete: `index.html`
- Delete: `css/`
- Delete: `js/`
- Delete: `sass/`
- Delete: `fonts/`
- Delete: `images/`
- Delete: `.github/workflows/azure-static-web-apps-orange-smoke-089e11b1e.yml`
- Modify: `.gitignore`

### Steps

- [ ] Confirm the approved portrait exists under `src/assets/images/` with the required hash before deleting `images/`.
- [ ] Run `npm run verify` before creating the intentionally failing legacy-removal test. Confirm the replacement is self-contained from the single artifact built and inspected by that aggregate.
- [ ] Write `no-legacy.test.mjs` first. Assert the listed legacy paths do not exist. Scan authored `src/` CSS/JS/template, dependency names in `package.json` and every workflow file that currently exists under `.github/workflows/` for the forbidden technologies/tokens; an empty workflow directory at this task boundary is valid. In built HTML inspect only classes, IDs and resource-bearing attributes/elements; do not scan article text, titles, excerpts or destination paths because legitimate editorial content may mention a technology. Exclude docs, tests and checker source because they intentionally name forbidden tokens. Task 9 separately requires and contract-tests the new `site.yml`; after it exists, this accumulated test also scans it.
- [ ] Run the test and record the expected failure listing legacy paths.
- [ ] Delete only the enumerated legacy paths with Git-aware removal:

```bash
git rm index.html
git rm -r css js sass fonts images
git rm .github/workflows/azure-static-web-apps-orange-smoke-089e11b1e.yml
```

- [ ] Search tracked files for `.DS_Store`; remove each exact tracked match if any. Do not use a broad recursive deletion command.
- [ ] Anchor generated ignores at repository root and retain only source assets under `src/`.
- [ ] Run:

```bash
node --test tests/contracts/no-legacy.test.mjs
npm run verify
git status --short
```

  Expect the legacy test and full suite to pass, `public/` to remain ignored, and no unrelated deletion.
- [ ] Commit only this task:

```bash
git add tests/contracts/no-legacy.test.mjs .gitignore
git commit -m "refactor: remove legacy site runtime"
```

- [ ] Keep this commit local. Continue directly to Task 9 before any push or merge.

---

## Task 9: Add one trusted CI and Azure delivery workflow

**Files:**

- Create: `.github/workflows/site.yml`
- Create: `tests/contracts/workflow.test.mjs`
- Modify: `README.md`

### Workflow contract

```text
events: pull_request(main), push(main), workflow_dispatch(target build-only|preview|production), cron 17 12 * * *
validate-and-build: no secrets; snapshot on PR; remote-required otherwise
deploy-preview: manual main only; target preview; named Azure environment qa
deploy-production: trusted main only; target production for manual runs
runner: ubuntu-24.04 for validate-and-build, deploy-preview and deploy-production
both deploy jobs: need validate-and-build; never PR; download exact public artifact
Azure inputs: app_location /public; output_location ""; skip_app_build true
concurrency: one group per PR; one shared non-canceling external group
freshness guard: main tip SHA and latest workflow run ID in the same run-name lane
preview guard: main only; PREVIEW_DEPLOY_ENABLED true; protected preview environment
release guard: main only; PRODUCTION_DEPLOY_ENABLED true; protected production environment
secret: AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SMOKE_089E11B1E
permissions: validation contents read; deploy adds actions read
```

### Steps

- [ ] Write `workflow.test.mjs` first with the `yaml` package. Assert exact events, cron and a typed `workflow_dispatch.deployment_target` choice with options `build-only`, `preview`, `production` and default `build-only`; require `runs-on: ubuntu-24.04` on all three jobs; also assert minimal permissions, Node 22.23.2, Temurin Java 21, `npm ci`, browser provisioning, every gate, artifact handoff, deploy conditions, Azure inputs and secret isolation.
- [ ] Assert `run-name` is deterministically `site / pr-<number>`, `site / build-only`, `site / preview` or `site / production`. PR concurrency is grouped by PR number with cancellation; every trusted event uses `site-external` without canceling an in-progress external job. Do not claim GitHub preserves a FIFO queue; superseded pending runs are acceptable.
- [ ] Assert validation has only `contents: read`; both deploy jobs have `contents: read` plus `actions: read`. Before artifact download/Azure, a fail-closed `gh api` guard compares `GITHUB_SHA` with `refs/heads/main` and `GITHUB_RUN_ID` with the greatest run ID whose `display_title` matches the current deployment lane. Every later external step requires `deploy_allowed == 'true'`.
- [ ] The guard shell must use `set -euo pipefail`, `GH_TOKEN: ${{ github.token }}`, `gh api repos/$GITHUB_REPOSITORY/git/ref/heads/main --jq .object.sha`, and `gh api "repos/$GITHUB_REPOSITORY/actions/workflows/site.yml/runs?branch=main&per_page=100"`. Filter out `pull_request`, select the exact `display_title`, compare numeric IDs and write only `deploy_allowed=true|false` to `GITHUB_OUTPUT`; API/parse failure exits nonzero.
- [ ] Assert `deploy-preview` requires `workflow_dispatch`, `refs/heads/main`, target `preview`, `vars.PREVIEW_DEPLOY_ENABLED == 'true'` and protected environment `preview`. Its Azure step sets `deployment_environment: qa` and records `steps.<id>.outputs.static_web_app_url`.
- [ ] Assert `deploy-production` requires `refs/heads/main`, `vars.PRODUCTION_DEPLOY_ENABLED == 'true'` and either push, schedule or manual target `production`; it uses protected environment `production` and omits `deployment_environment`. Missing variables leave both deploy jobs disabled.
- [ ] Assert both Azure steps reference exactly `secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SMOKE_089E11B1E`. Any secret rename/rotation remains outside this plan.
- [ ] Assert every `uses:` value ends in exactly 40 lowercase hexadecimal characters. Assert there is no `pull_request_target`, `npm install`, source write, auto-commit, second build in deploy or deployment path outside `/public`.
- [ ] Run the workflow test and record the expected missing-file failure.
- [ ] Use and contract-test this verified 2026-08-15 action pin table. Re-run `git ls-remote --tags` against each official repository before implementation; if a tag no longer resolves to the recorded commit, stop for explicit supply-chain review instead of silently changing the pin.

| Action | Release tag | Full commit SHA |
|---|---|---|
| `actions/checkout` | `v7.0.1` | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | `v7.0.0` | `820762786026740c76f36085b0efc47a31fe5020` |
| `actions/setup-java` | `v5.7.0` | `b6effb05e454b25005698d916606bdc6ffcbf961` |
| `actions/upload-artifact` | `v7.0.1` | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |
| `actions/download-artifact` | `v8.0.1` | `3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c` |
| `Azure/static-web-apps-deploy` | `v1` | `1a947af9992250f3bc2e68ad0754c0b0c11566c9` |

  Put the release tag in an adjacent YAML comment and the full SHA in every `uses:` value.
- [ ] Implement the workflow. After `npm ci`, run `npm exec -- playwright install --with-deps chromium firefox`. Run `npm run verify:snapshot` for PRs and `npm run verify:remote` for trusted events so every artifact is built exactly once before Nu, manifest, Playwright, axe and Lighthouse inspect that same directory.
- [ ] Add a separate reporting step with `if: ${{ always() }}`. If `build-report.json` exists, accept it only after a 32 KiB maximum-size check, JSON parse and exact `BuildReport` schema/sanitization check, then append it to `$GITHUB_STEP_SUMMARY`; if a prior step failed before the report existed, append the literal `BuildReport indisponível: falha anterior ao build.`. This step must never turn a failed aggregate into success and must never include raw XML, response bodies, secrets or API responses.
- [ ] Write the sorted artifact manifest to the step summary and upload `public/` only under `if: success()` after the chosen aggregate command succeeds. Extend `workflow.test.mjs` to assert the always-running report step, its bounds/schema guard, and success-only manifest/artifact upload; a `refresh-error` report must remain visible while no deployable artifact is uploaded.
- [ ] Make remote failure fatal before upload/deploy. This intentionally leaves the previous Azure deployment unchanged. Keep both deploy jobs disabled by default; do not create either environment or enable either repository variable in this task.
- [ ] Scope the existing Azure token expression to the two Azure steps only. The validation job and PR events must have no environment or secret reference. Pass only the ephemeral `GITHUB_TOKEN` to freshness guards; never print it or persist API responses.
- [ ] Update `README.md` with architecture, prerequisites, canonical commands, snapshot policy, exact daily schedule, preview/production authorization boundary and the third-party accessibility limitation.
- [ ] Run:

```bash
node --test tests/contracts/workflow.test.mjs
npm run verify
git diff --check
```

  Expect pass and no workflow secret outside the deploy step.
- [ ] Commit only this task:

```bash
git add .github/workflows/site.yml tests/contracts/workflow.test.mjs README.md
git commit -m "ci: gate static artifact before Azure deploy"
```

---

## Task 10: Complete local implementation verification

**Files:**

- Create: `docs/validation/personal-site-local.md`
- Create: `docs/validation/screenshots/desktop-1440.png`
- Create: `docs/validation/screenshots/tablet-768.png`
- Create: `docs/validation/screenshots/mobile-320.png`
- Create: `docs/validation/screenshots/breakpoint-480.png`
- Create: `docs/validation/screenshots/breakpoint-481.png`
- Modify only if a verified defect is found: files owned by Tasks 1–9

### Steps

- [ ] Start from a clean checkout of the implementation branch. Confirm Node 22.23.2 and Java 21, run `npm ci && npm run browsers:install`, and record Node/npm/Java/browser versions plus the implementation commit SHA in the validation document.
- [ ] Run the complete fresh gate:

```bash
npm run verify
```

  Record each command, exit code and report path. Do not summarize a partial command as full verification.
- [ ] Re-run `npm run build:snapshot`, hash the sorted artifact manifest, delete the generated `public/`, rebuild, and assert the manifest hash is identical.
- [ ] Capture full-page screenshots at 320, 480, 481, 768 and 1440 after the final build. Compare them with the durable design reference and inspect face crop, line breaks, CTA priority, card alignment, focus indicators, no overflow and the exact 480/481 embed transition.
- [ ] Manually inspect the page with CSS disabled, JS disabled and the iframe URL blocked. Record whether content, navigation and both Substack fallbacks remain usable.
- [ ] Execute keyboard-only navigation and 200% zoom/reflow locally in Chromium and Firefox. Record observed focus order and any limitation; do not claim screen-reader or Safari coverage from this step.
- [ ] Verify `git status --short` contains only the planned validation evidence and that no `public/`, report folder, raw feed or credential is staged.
- [ ] If a defect is found, add a regression test first, make the smallest correction in the owning file, rerun the affected gate and then rerun `npm run verify`. Record the defect and evidence.
- [ ] Commit only local evidence after all gates pass:

```bash
git add docs/validation/personal-site-local.md docs/validation/screenshots
git commit -m "docs: record local personal site verification"
```

- [ ] Stop here and request explicit authorization for Task 11. Local completion does not authorize an external preview or production deploy.

---

## Task 11: Validate an authorized Azure preview and launch boundary

**Precondition:** The user explicitly authorizes (a) merging the already verified implementation to `main` while both deploy flags remain false, (b) creating an external Azure named preview, and (c) whether a real Substack test submission may be sent. Treat these as separate approvals; without one, perform only the authorized subset and leave this task open. Preview authorization does not authorize creation of the protected `production` environment or enabling `PRODUCTION_DEPLOY_ENABLED`.

**Files:**

- Create after authorization: `docs/validation/personal-site-preview.md`
- Modify only after verified preview defects: implementation files and their regression tests

### Steps

- [ ] Confirm the Azure resource/account, existing secret name, named environment `qa`, no-custom-domain preview boundary and allowed Substack test address before any external write or form submission.
- [ ] With read-only GitHub checks, prove repository variables `PREVIEW_DEPLOY_ENABLED` and `PRODUCTION_DEPLOY_ENABLED` are absent or not `true`. Push the implementation branch only if authorized, then verify the PR workflow runs from snapshot without deploy secret or RSS network.
- [ ] Present the clean PR plus local evidence and obtain the distinct merge authorization. Merge to `main` only while both flags are false; confirm the resulting push run builds remotely but executes neither Azure job.
- [ ] Create/configure the protected GitHub environment `preview` and set the repository variable `PREVIEW_DEPLOY_ENABLED=true` only after preview authorization. Keep `PRODUCTION_DEPLOY_ENABLED` absent/false.
- [ ] Dispatch `.github/workflows/site.yml` on `main` with `deployment_target=preview`. Verify the `deploy-preview` job consumes the already gated artifact, passes `deployment_environment: qa`, and record the action output `static_web_app_url`; do not point `delatorre.dev` or production traffic at it.
- [ ] Verify HTTP 200 for `/`, 404 for an unknown path, exact headers, blocking CSP, MIME types, asset allowlist and zero console/CSP violations before iframe activation.
- [ ] Inspect Network at 320, 480, 481 and 1440: zero third-party request before action; no iframe at ≤480; one parent-initiated navigation to the approved Substack frame after action at ≥481; no parent request to RSS, AllOrigins, SociableKit or remote fonts. Inventory the frame's own subrequests/cookies separately without claiming they are limited to one.
- [ ] Test iframe blocked, successful navigation, 12-second timeout, focus behavior and fallback. Confirm that asynchronous `load`/timeout never move focus, that focus never falls to `body`, and that the load event does not establish submission success.
- [ ] If real submission is authorized, use only the named test address and record success/error/double-opt-in behavior without storing the address, cookies or payload in Git/GitHub.
- [ ] Perform the human accessibility matrix: keyboard and 200% zoom in Chrome/Firefox, one real mobile browser, and NVDA/Firefox or Safari/VoiceOver. Identify the Substack frame in any partial-conformance statement.
- [ ] In the named preview, verify absolute canonical metadata, robots, sitemap, the equivalent social-image path as HTTP 200/JPEG, and production-like Lighthouse measurements. Separate pre-click and post-click results. Do not claim that the preview proves the final-domain asset, redirects, headers or social-card rendering.
- [ ] Record exact evidence, untested surfaces and a launch verdict in `personal-site-preview.md`.
- [ ] After evidence capture, set `PREVIEW_DEPLOY_ENABLED=false`. Do not delete the named Azure preview environment or its data without a separate destructive-action authorization.
- [ ] If any implementation file changes, add its regression test, rerun `npm run verify`, repeat the affected preview check, and commit the correction separately.
- [ ] Do not deploy to production. Present the preview evidence and request a distinct production authorization.
- [ ] Record the remaining operational gate explicitly: only after a separately authorized production deploy may a later task verify the final-domain social image, headers/CSP, HTTP/`www`/Azure-host redirects, canonical, robots, sitemap and social debugger, with immediate rollback on a blocking failure. This plan does not perform or authorize that deploy.

## Final plan audit

Before handing this plan to an implementation worker:

- [ ] Confirm every requirement in the consolidated specification maps to a task or explicit launch gate.
- [ ] Search this plan and the specification for unresolved markers and ambiguous future prose:

```bash
rg -n '\bT[B]D\b|\bT[O]DO\b|[Ii]mplement[[:space:]]+late[r]|[Aa]ppropriat[e]|[Ss]imilar[[:space:]]+t[o]|[Ss]ame[[:space:]]+as[[:space:]]+abov[e]|[Ff]ill[[:space:]]+i[n]|[Pp]laceholde[r]' docs/specs/2026-08-15-personal-site.md docs/superpowers/plans/2026-08-15-personal-site-implementation.md
```

  Expect zero matches.
- [ ] Verify every local source link resolves and every future file is explicitly labeled Create, Modify or Delete.
- [ ] Check that `Article`, `ArticleSnapshot`, `ParseFeedResult`, `FeedResult`, `BuildReport`, build modes, breakpoints, budgets, URLs and error codes are identical across specification and plan.
- [ ] Confirm Task 10 stops before external mutation and Task 11 stops before production.
