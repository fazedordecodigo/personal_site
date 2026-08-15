## Build pipeline

The `validate-and-build` job always uses `npm run verify:snapshot` (`.github/workflows/site.yml`).
The committed `content/articles.snapshot.json` is the single source of truth for articles in CI.

When the Substack feed needs to update the site's article list, run `npm run snapshot:refresh` locally,
review `content/articles.snapshot.json`, and commit the result before pushing or dispatching a deployment.
The `remote-required` build mode exists for local/offline validation only; it is not used in CI because
live fetches from `fazedordecodigo.substack.com/feed` are blocked from GitHub Actions runners.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The default canonical triage labels are used. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context layout. See `docs/agents/domain.md`.
