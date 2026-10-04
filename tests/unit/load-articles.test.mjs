import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { FEED_URL, MAX_FEED_BYTES } from "../../scripts/articles/constants.mjs";
import {
  FeedFetchError,
  SnapshotContractError,
  fetchRemoteSnapshot,
  loadArticles,
  readSnapshot,
} from "../../scripts/articles/load-articles.mjs";

const now = new Date("2026-08-15T12:17:00.000Z");
const article = (id, number) => ({
  id,
  title: `Fazedor de Código: artigo ${number}`,
  excerpt: `Resumo ${number}.`,
  publishedAt: `2026-08-${String(10 + number).padStart(2, "0")}T12:00:00.000Z`,
  url: `https://dev.to/fazedordecodigo/fixture-${number}`,
  eyebrow: "Artigo",
});
const snapshot = (fetchedAt = "2026-08-15T10:00:00.000Z") => ({
  schemaVersion: 1,
  sourceUrl: FEED_URL,
  fetchedAt,
  timeZone: "America/Sao_Paulo",
  articles: [article("1", 1), article("2", 2), article("3", 3)],
});

const feedJson = JSON.stringify([
  { id: "one", title: "Fazedor de Código: um", description: "Resumo um.", url: "https://dev.to/fazedordecodigo/fixture-one", published_at: "2026-08-13T10:00:00.000Z" },
  { id: "two", title: "Fazedor de Código: dois", description: "Resumo dois.", url: "https://dev.to/fazedordecodigo/fixture-two", published_at: "2026-08-12T10:00:00.000Z" },
  { id: "three", title: "Fazedor de Código: três", description: "Resumo três.", url: "https://dev.to/fazedordecodigo/fixture-three", published_at: "2026-08-11T10:00:00.000Z" },
]);

async function writeSnapshotFile(value) {
  const directory = await mkdtemp(join(tmpdir(), "personal-site-snapshot-"));
  const path = join(directory, "articles.snapshot.json");
  await writeFile(path, JSON.stringify(value));
  return path;
}

test("snapshot mode performs zero fetches and returns a fresh FeedResult", async () => {
  const snapshotPath = await writeSnapshotFile(snapshot());
  let fetchCalls = 0;
  const result = await loadArticles({
    mode: "snapshot",
    snapshotPath,
    now: () => now,
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error("network must not be used");
    },
  });
  assert.equal(fetchCalls, 0);
  assert.equal(result.source, "snapshot");
  assert.equal(result.state, "fresh");
  assert.equal(result.warningCode, null);
  assert.equal(result.articles.length, 3);
});

test("snapshot validation rejects schema and fetchedAt mismatches", async () => {
  const wrongSchema = snapshot();
  wrongSchema.schemaVersion = 2;
  await assert.rejects(readSnapshot({ snapshotPath: await writeSnapshotFile(wrongSchema), now: () => now }), (error) => {
    assert.ok(error instanceof SnapshotContractError);
    assert.equal(error.code, "SNAPSHOT_INVALID");
    return true;
  });
  const invalidDate = snapshot();
  invalidDate.fetchedAt = "not a date";
  await assert.rejects(readSnapshot({ snapshotPath: await writeSnapshotFile(invalidDate), now: () => now }), (error) => {
    assert.ok(error instanceof SnapshotContractError);
    return true;
  });
});

test("snapshot becomes stale only after 48 hours, not at the boundary", async () => {
  const boundary = new Date("2026-08-13T12:17:00.000Z");
  const path = await writeSnapshotFile(snapshot("2026-08-11T12:17:00.000Z"));
  const exactly = await readSnapshot({ snapshotPath: path, now: () => boundary });
  assert.equal(exactly.state, "fresh");
  assert.equal(exactly.warningCode, null);

  const after = await readSnapshot({
    snapshotPath: path,
    now: () => new Date(boundary.getTime() + 1),
  });
  assert.equal(after.state, "stale");
  assert.equal(after.warningCode, "SNAPSHOT_STALE");
});

test("remote fetch validates status and content type", async () => {
  await assert.rejects(fetchRemoteSnapshot({ fetchImpl: async () => new Response("no", { status: 500 }), now: () => now, sleep: async () => {} }), (error) => {
    assert.ok(error instanceof FeedFetchError);
    assert.equal(error.code, "HTTP_STATUS");
    return true;
  });
  await assert.rejects(fetchRemoteSnapshot({ fetchImpl: async () => new Response(feedJson, { status: 200, headers: { "content-type": "text/html" } }), now: () => now, sleep: async () => {} }), (error) => {
    assert.equal(error.code, "CONTENT_TYPE");
    return true;
  });
});

test("remote fetch rejects Content-Length and streamed bodies over 1 MiB", async () => {
  const tooLargeHeader = new Response("small", {
    status: 200,
    headers: { "content-type": "application/json", "content-length": String(MAX_FEED_BYTES + 1) },
  });
  await assert.rejects(fetchRemoteSnapshot({ fetchImpl: async () => tooLargeHeader, now: () => now, sleep: async () => {} }), (error) => {
    assert.equal(error.code, "BODY_TOO_LARGE");
    return true;
  });

  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_FEED_BYTES + 1));
      controller.close();
    },
  });
  await assert.rejects(fetchRemoteSnapshot({ fetchImpl: async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } }), now: () => now, sleep: async () => {} }), (error) => {
    assert.equal(error.code, "BODY_TOO_LARGE");
    return true;
  });
});

test("remote fetch applies timeout and retry policy with two attempts maximum", async () => {
  for (const failure of [
    new Error("network"),
    new FeedFetchError("TIMEOUT", "timeout"),
    new Response("busy", { status: 429 }),
    new Response("server", { status: 503 }),
  ]) {
    let attempts = 0;
    const result = await fetchRemoteSnapshot({
      fetchImpl: async () => {
        attempts += 1;
        if (failure instanceof Response) return failure;
        throw failure;
      },
      now: () => now,
      sleep: async (milliseconds) => assert.equal(milliseconds, 500),
      timeoutMs: 5,
    }).catch((error) => error);
    assert.equal(attempts, 2);
    assert.ok(result instanceof FeedFetchError);
  }
});

test("remote fetch does not retry malformed JSON or forbidden redirects", async () => {
  let malformedAttempts = 0;
  await assert.rejects(fetchRemoteSnapshot({
    fetchImpl: async () => {
      malformedAttempts += 1;
      return new Response("{", { status: 200, headers: { "content-type": "application/json" } });
    },
    now: () => now,
    sleep: async () => assert.fail("malformed JSON must not sleep"),
  }), (error) => {
    assert.equal(error.code, "REMOTE_CONTRACT");
    return true;
  });
  assert.equal(malformedAttempts, 1);

  let redirectAttempts = 0;
  await assert.rejects(fetchRemoteSnapshot({
    fetchImpl: async () => {
      redirectAttempts += 1;
      return new Response(null, { status: 302, headers: { location: "https://evil.example/api/articles" } });
    },
    now: () => now,
    sleep: async () => assert.fail("forbidden redirect must not sleep"),
  }), (error) => {
    assert.equal(error.code, "REDIRECT_FORBIDDEN");
    return true;
  });
  assert.equal(redirectAttempts, 1);
});

test("remote fetch validates at most three approved redirects", async () => {
  const calls = [];
  const result = await fetchRemoteSnapshot({
    fetchImpl: async (url) => {
      calls.push(url);
      if (calls.length <= 3) {
        return new Response(null, { status: 302, headers: { location: `https://dev.to/api/articles?redirect=${calls.length}` } });
      }
      return new Response(feedJson, { status: 200, headers: { "content-type": "application/json" } });
    },
    now: () => now,
    sleep: async () => {},
  });
  assert.equal(calls.length, 4);
  assert.equal(result.feedResult.source, "remote");
  assert.equal(result.snapshot.articles.length, 3);
});

test("remote-required never falls back to the repository snapshot", async () => {
  const snapshotPath = await writeSnapshotFile(snapshot());
  await assert.rejects(loadArticles({
    mode: "remote-required",
    snapshotPath,
    fetchImpl: async () => new Response("no", { status: 503 }),
    now: () => now,
    sleep: async () => {},
  }), (error) => {
    assert.ok(error instanceof FeedFetchError);
    assert.equal(error.code, "HTTP_STATUS");
    return true;
  });
});
