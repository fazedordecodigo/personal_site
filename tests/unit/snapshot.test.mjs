import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { writeSnapshotAtomic } from "../../scripts/articles/snapshot.mjs";

const makeSnapshot = () => ({
  schemaVersion: 1,
  sourceUrl: "https://fazedordecodigo.substack.com/feed",
  fetchedAt: "2026-08-15T12:17:00.000Z",
  timeZone: "America/Sao_Paulo",
  articles: [1, 2, 3].map((number) => ({
    id: `urn:fixture:${number}`,
    title: `Fazedor de Código: ${number}`,
    excerpt: `Resumo ${number}.`,
    publishedAt: `2026-08-${String(10 + number).padStart(2, "0")}T12:00:00.000Z`,
    url: `https://fazedordecodigo.substack.com/p/fixture-${number}`,
    eyebrow: "Fazedor de Código",
  })),
});

test("atomic snapshot write leaves one newline-terminated file and no temporary sibling", async () => {
  const directory = await mkdtemp(join(tmpdir(), "personal-site-atomic-"));
  const destination = join(directory, "articles.snapshot.json");
  await writeSnapshotAtomic(makeSnapshot(), destination);
  const content = await readFile(destination, "utf8");
  assert.equal(content.endsWith("\n"), true);
  assert.deepEqual(JSON.parse(content), makeSnapshot());
  assert.deepEqual(await readdir(directory), ["articles.snapshot.json"]);
});

test("invalid snapshot input leaves the existing destination byte-identical", async () => {
  const directory = await mkdtemp(join(tmpdir(), "personal-site-atomic-invalid-"));
  const destination = join(directory, "articles.snapshot.json");
  const previous = "previous\n";
  await writeFile(destination, previous);
  const invalid = makeSnapshot();
  invalid.articles = [];
  await assert.rejects(writeSnapshotAtomic(invalid, destination));
  assert.equal(await readFile(destination, "utf8"), previous);
  assert.deepEqual(await readdir(directory), ["articles.snapshot.json"]);
});

test("write failure does not leave a temporary file or replace the destination", async () => {
  const directory = await mkdtemp(join(tmpdir(), "personal-site-atomic-failure-"));
  const destination = join(directory, "missing", "articles.snapshot.json");
  await assert.rejects(writeSnapshotAtomic(makeSnapshot(), destination));
  assert.deepEqual(await readdir(directory), []);
});
