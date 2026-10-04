import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { TalksSnapshotError, loadTalks, validateTalksSnapshot } from "../../scripts/talks/load-talks.mjs";

const snapshot = () => ({
  source: "Notion Conteúdos",
  filter: "Tipo contains Palestra",
  fetched_at: "2026-10-03",
  count: 14,
  talks: Array.from({ length: 14 }, (_, index) => ({
    tema: `Palestra ${index + 1}`,
    data: `2026-09-${String(14 - index).padStart(2, "0")}`,
    evento: index === 0 ? null : `Evento ${index + 1}`,
    local: ["Rio de Janeiro"],
    url: index === 1 ? null : `https://example.com/talk-${index + 1}`,
    tipo: index === 2 ? ["Evento", "Palestra"] : ["Palestra"],
    notion: `https://app.notion.com/talk-${index + 1}`,
  })),
});

async function writeTalks(value) {
  const directory = await mkdtemp(join(tmpdir(), "personal-site-talks-"));
  const path = join(directory, "talks.snapshot.json");
  await writeFile(path, JSON.stringify(value));
  return path;
}

test("loads the committed 14-row talks snapshot without fetching", async () => {
  const result = await loadTalks({ snapshotPath: new URL("../../content/talks.snapshot.json", import.meta.url).pathname });
  assert.equal(result.count, 14);
  assert.equal(result.talks.length, 14);
  assert.equal(result.talks[0].tema, "TBD");
  assert.equal(result.talks[0].url, null);
  assert.equal(result.talks[8].evento, null);
  assert.ok(result.talks.every((talk) => talk.tipo.includes("Palestra")));
});

test("rejects snapshots that are not exactly 14 valid palestra rows", async () => {
  const short = snapshot();
  short.count = 13;
  short.talks.pop();
  assert.throws(() => validateTalksSnapshot(short), (error) => error instanceof TalksSnapshotError);
  const missingType = snapshot();
  missingType.talks[0].tipo = ["Evento"];
  assert.throws(() => validateTalksSnapshot(missingType), (error) => error instanceof TalksSnapshotError);
  await assert.rejects(loadTalks({ snapshotPath: await writeTalks({ bad: true }) }), (error) => {
    assert.ok(error instanceof TalksSnapshotError);
    assert.equal(error.code, "TALKS_SNAPSHOT_INVALID");
    return true;
  });
});
