import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EXCERPT_LIMIT,
  FEED_URL,
  TITLE_LIMIT,
  TIME_ZONE,
} from "../../scripts/articles/constants.mjs";
import { FeedContractError, parseFeed } from "../../scripts/articles/parse-feed.mjs";

const fixture = (name) => readFile(new URL(`../fixtures/${name}`, import.meta.url), "utf8");

test("normalizes, orders and limits valid articles without leaking ignored fields", async () => {
  const result = parseFeed(await fixture("feed-valid.xml"));
  assert.deepEqual(Object.keys(result.articles[0]).sort(), ["excerpt", "eyebrow", "id", "publishedAt", "title", "url"]);
  assert.deepEqual(result.articles.map((article) => article.id), [
    "urn:fixture:cursor-3",
    "urn:fixture:devin-2",
    "urn:fixture:fazedor-1",
  ]);
  assert.equal(result.articles[0].title, "Cursor Weekly: Clareza & prática");
  assert.equal(result.articles[0].excerpt, "Uma <ideia> com texto útil.");
  assert.equal(result.articles[0].url, `${FEED_URL.replace("/feed", "")}/p/fixture-cursor`);
  assert.equal(result.articles[0].publishedAt, "2026-08-13T03:48:38.000Z");
  assert.deepEqual(result.articles.map((article) => article.eyebrow), ["Cursor Weekly", "Devin Weekly", "Fazedor de Código"]);
  assert.deepEqual(result.diagnostics, {
    totalItems: 6,
    acceptedBeforeLimit: 6,
    discardedByCode: {
      FIELD_INVALID: 0,
      URL_FORBIDDEN: 0,
      DATE_INVALID: 0,
      DUPLICATE_CONFLICT: 0,
      DUPLICATE_IDENTICAL: 0,
    },
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.articles[0], "content:encoded"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.articles[0], "enclosure"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.articles[0], "creator"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.articles[0], "email"), false);
  assert.equal(Object.isFrozen(result.articles), true);
  assert.equal(Object.isFrozen(result.articles[0]), true);
});

test("truncates title and excerpt by code point after NFC whitespace normalization", () => {
  const longTitle = `  ${"A".repeat(TITLE_LIMIT + 10)}  `;
  const longDescription = `  ${"😀".repeat(EXCERPT_LIMIT + 10)}  `;
  const xml = `<rss><channel><item><title>${longTitle}</title><description>${longDescription}</description><link>https://fazedordecodigo.substack.com/p/fixture-long</link><guid>urn:fixture:long</guid><pubDate>Wed, 13 Aug 2026 10:00:00 GMT</pubDate></item><item><title>v2</title><description>v2</description><link>https://fazedordecodigo.substack.com/p/fixture-v2</link><guid>urn:fixture:v2</guid><pubDate>Tue, 12 Aug 2026 10:00:00 GMT</pubDate></item><item><title>v3</title><description>v3</description><link>https://fazedordecodigo.substack.com/p/fixture-v3</link><guid>urn:fixture:v3</guid><pubDate>Mon, 11 Aug 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  const [article] = parseFeed(xml).articles;
  assert.equal(Array.from(article.title).length, TITLE_LIMIT);
  assert.equal(Array.from(article.excerpt).length, EXCERPT_LIMIT);
  assert.equal(article.title.startsWith("A"), true);
  assert.equal(article.excerpt, "😀".repeat(EXCERPT_LIMIT));
});

test("rejects DTD/entity declarations and malformed XML with stable error codes", async () => {
  await assert.rejects(fixture("feed-malicious-dtd.xml").then(parseFeed), (error) => {
    assert.ok(error instanceof FeedContractError);
    assert.equal(error.code, "DTD_FORBIDDEN");
    return true;
  });
  await assert.rejects(fixture("feed-malformed.xml").then(parseFeed), (error) => {
    assert.ok(error instanceof FeedContractError);
    assert.equal(error.code, "XML_INVALID");
    return true;
  });
});

test("collapses identical duplicate IDs and discards conflicting groups", async () => {
  const result = parseFeed(await fixture("feed-duplicates.xml"));
  assert.deepEqual(result.articles.map((article) => article.id), [
    "urn:fixture:valid-one",
    "urn:fixture:valid-two",
    "urn:fixture:valid-three",
  ]);
  assert.equal(result.diagnostics.acceptedBeforeLimit, 4);
  assert.equal(result.diagnostics.discardedByCode.DUPLICATE_IDENTICAL, 1);
  assert.equal(result.diagnostics.discardedByCode.DUPLICATE_CONFLICT, 1);
});

test("counts invalid fields without persisting their values", async () => {
  const result = parseFeed(await fixture("feed-invalid-fields.xml"));
  assert.equal(result.articles.length, 3);
  assert.equal(result.diagnostics.totalItems, 6);
  assert.equal(result.diagnostics.discardedByCode.FIELD_INVALID, 1);
  assert.equal(result.diagnostics.discardedByCode.URL_FORBIDDEN, 1);
  assert.equal(result.diagnostics.discardedByCode.DATE_INVALID, 1);
  assert.doesNotMatch(JSON.stringify(result), /example\.com|not a date|invalid-title/);
});

test("requires exactly three valid unique articles", async () => {
  await assert.rejects(fixture("feed-empty.xml").then(parseFeed), (error) => {
    assert.equal(error.code, "ITEMS_INSUFFICIENT");
    return true;
  });
});

test("exports the fixed timezone used by date rendering", () => {
  assert.equal(TIME_ZONE, "America/Sao_Paulo");
});
