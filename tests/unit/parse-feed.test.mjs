import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EXCERPT_LIMIT,
  TITLE_LIMIT,
  TIME_ZONE,
} from "../../scripts/articles/constants.mjs";
import { FeedContractError, parseFeed } from "../../scripts/articles/parse-feed.mjs";

const fixture = (name) => readFile(new URL(`../fixtures/${name}`, import.meta.url), "utf8");

test("normalizes, orders and limits valid articles without leaking ignored fields", async () => {
  const result = parseFeed(await fixture("articles-valid.json"));
  assert.deepEqual(Object.keys(result.articles[0]).sort(), ["excerpt", "eyebrow", "id", "publishedAt", "title", "url"]);
  assert.deepEqual(result.articles.map((article) => article.id), ["3", "2", "1"]);
  assert.equal(result.articles[0].title, "Cursor Weekly: Clareza & prática");
  assert.equal(result.articles[0].excerpt, "Uma <ideia> com texto útil.");
  assert.equal(result.articles[0].url, "https://dev.to/fazedordecodigo/fixture-cursor");
  assert.equal(result.articles[0].publishedAt, "2026-08-13T03:48:38.000Z");
  assert.deepEqual(result.articles.map((article) => article.eyebrow), ["Artigo", "Artigo", "Artigo"]);
  assert.deepEqual(result.diagnostics, {
    totalItems: 4,
    acceptedBeforeLimit: 4,
    discardedByCode: {
      FIELD_INVALID: 0,
      URL_FORBIDDEN: 0,
      DATE_INVALID: 0,
      DUPLICATE_CONFLICT: 0,
      DUPLICATE_IDENTICAL: 0,
    },
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.articles[0], "cover_image"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.articles[0], "user"), false);
  assert.equal(Object.isFrozen(result.articles), true);
  assert.equal(Object.isFrozen(result.articles[0]), true);
});

test("truncates title and excerpt by code point after NFC whitespace normalization", () => {
  const payload = [
    { id: "long", title: `  ${"A".repeat(TITLE_LIMIT + 10)}  `, description: `  ${"😀".repeat(EXCERPT_LIMIT + 10)}  `, url: "https://dev.to/fazedordecodigo/fixture-long", published_at: "2026-08-13T10:00:00.000Z" },
    { id: "v2", title: "v2", description: "v2", url: "https://dev.to/fazedordecodigo/fixture-v2", published_at: "2026-08-12T10:00:00.000Z" },
    { id: "v3", title: "v3", description: "v3", url: "https://dev.to/fazedordecodigo/fixture-v3", published_at: "2026-08-11T10:00:00.000Z" },
  ];
  const [article] = parseFeed(JSON.stringify(payload)).articles;
  assert.equal(Array.from(article.title).length, TITLE_LIMIT);
  assert.equal(Array.from(article.excerpt).length, EXCERPT_LIMIT);
  assert.equal(article.title.startsWith("A"), true);
  assert.equal(article.excerpt, "😀".repeat(EXCERPT_LIMIT));
});

test("rejects malformed JSON with a stable error code", () => {
  assert.throws(() => parseFeed("{"), (error) => {
    assert.ok(error instanceof FeedContractError);
    assert.equal(error.code, "JSON_INVALID");
    return true;
  });
  assert.throws(() => parseFeed("{\"title\":\"no\"}"), (error) => {
    assert.equal(error.code, "JSON_INVALID");
    return true;
  });
});

test("collapses identical duplicate IDs and discards conflicting groups", () => {
  const payload = [
    { id: "dup", title: "Mesmo", description: "Mesmo", url: "https://dev.to/fazedordecodigo/fixture-dup", published_at: "2026-08-13T10:00:00.000Z" },
    { id: "dup", title: "Mesmo", description: "Mesmo", url: "https://dev.to/fazedordecodigo/fixture-dup", published_at: "2026-08-13T10:00:00.000Z" },
    { id: "conflict", title: "A", description: "A", url: "https://dev.to/fazedordecodigo/fixture-a", published_at: "2026-08-12T10:00:00.000Z" },
    { id: "conflict", title: "B", description: "B", url: "https://dev.to/fazedordecodigo/fixture-b", published_at: "2026-08-12T10:00:00.000Z" },
    { id: "one", title: "Um", description: "Um", url: "https://dev.to/fazedordecodigo/fixture-one", published_at: "2026-08-11T10:00:00.000Z" },
    { id: "two", title: "Dois", description: "Dois", url: "https://dev.to/fazedordecodigo/fixture-two", published_at: "2026-08-10T10:00:00.000Z" },
    { id: "three", title: "Três", description: "Três", url: "https://dev.to/fazedordecodigo/fixture-three", published_at: "2026-08-09T10:00:00.000Z" },
  ];
  const result = parseFeed(JSON.stringify(payload));
  assert.deepEqual(result.articles.map((article) => article.id), ["dup", "one", "two"]);
  assert.equal(result.diagnostics.acceptedBeforeLimit, 4);
  assert.equal(result.diagnostics.discardedByCode.DUPLICATE_IDENTICAL, 1);
  assert.equal(result.diagnostics.discardedByCode.DUPLICATE_CONFLICT, 1);
});

test("counts invalid fields without persisting their values", () => {
  const payload = [
    { id: "empty", title: "", description: "sem título", url: "https://dev.to/fazedordecodigo/empty", published_at: "2026-08-13T10:00:00.000Z" },
    { id: "bad-url", title: "Fora", description: "resumo", url: "https://example.com/p/x", published_at: "2026-08-13T10:00:00.000Z" },
    { id: "bad-date", title: "Data", description: "resumo", url: "https://dev.to/fazedordecodigo/date", published_at: "not a date" },
    { id: "one", title: "Um", description: "Resumo um.", url: "https://dev.to/fazedordecodigo/one", published_at: "2026-08-11T10:00:00.000Z" },
    { id: "two", title: "Dois", description: "Resumo dois.", url: "https://dev.to/fazedordecodigo/two", published_at: "2026-08-10T10:00:00.000Z" },
    { id: "three", title: "Três", description: "Resumo três.", url: "https://dev.to/fazedordecodigo/three", published_at: "2026-08-09T10:00:00.000Z" },
  ];
  const result = parseFeed(JSON.stringify(payload));
  assert.equal(result.articles.length, 3);
  assert.equal(result.diagnostics.totalItems, 6);
  assert.equal(result.diagnostics.discardedByCode.FIELD_INVALID, 1);
  assert.equal(result.diagnostics.discardedByCode.URL_FORBIDDEN, 1);
  assert.equal(result.diagnostics.discardedByCode.DATE_INVALID, 1);
  assert.doesNotMatch(JSON.stringify(result), /example\.com|not a date|sem título/);
});

test("requires exactly three valid unique articles", () => {
  assert.throws(() => parseFeed("[]"), (error) => {
    assert.equal(error.code, "ITEMS_INSUFFICIENT");
    return true;
  });
});

test("exports the fixed timezone used by date rendering", () => {
  assert.equal(TIME_ZONE, "America/Sao_Paulo");
});
