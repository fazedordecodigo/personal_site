import { readFile } from "node:fs/promises";

import {
  ARTICLE_EYEBROWS,
  FEED_URL,
  EXCERPT_LIMIT,
  MAX_FEED_BYTES,
  TIME_ZONE,
  TITLE_LIMIT,
} from "./constants.mjs";
import { FeedContractError, parseFeed } from "./parse-feed.mjs";

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 500;
const SNAPSHOT_KEYS = ["schemaVersion", "sourceUrl", "fetchedAt", "timeZone", "articles"];
const ARTICLE_KEYS = ["id", "title", "excerpt", "publishedAt", "url", "eyebrow"];

export class FeedFetchError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "FeedFetchError";
    this.code = code;
    this.status = options.status ?? null;
  }
}

export class SnapshotContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "SnapshotContractError";
    this.code = "SNAPSHOT_INVALID";
  }
}

function exactKeys(value, expected) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function isIsoInstant(value) {
  if (typeof value !== "string") {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function validArticle(article) {
  if (!exactKeys(article, ARTICLE_KEYS)) {
    return false;
  }
  if (
    typeof article.id !== "string" ||
    article.id.length === 0 ||
    Array.from(article.id).length > 2048 ||
    typeof article.title !== "string" ||
    Array.from(article.title).length < 1 ||
    Array.from(article.title).length > TITLE_LIMIT ||
    typeof article.excerpt !== "string" ||
    Array.from(article.excerpt).length < 1 ||
    Array.from(article.excerpt).length > EXCERPT_LIMIT ||
    !isIsoInstant(article.publishedAt) ||
    typeof article.url !== "string" ||
    typeof article.eyebrow !== "string" ||
    !ARTICLE_EYEBROWS.includes(article.eyebrow)
  ) {
    return false;
  }
  let url;
  try {
    url = new URL(article.url);
  } catch {
    return false;
  }
  return url.protocol === "https:" &&
    url.hostname === "fazedordecodigo.substack.com" &&
    url.username === "" &&
    url.password === "" &&
    url.port === "" &&
    url.pathname.startsWith("/p/") &&
    url.search === "" &&
    url.hash === "";
}

export function validateSnapshotObject(snapshot) {
  if (
    !exactKeys(snapshot, SNAPSHOT_KEYS) ||
    snapshot.schemaVersion !== 1 ||
    snapshot.sourceUrl !== FEED_URL ||
    snapshot.timeZone !== TIME_ZONE ||
    !isIsoInstant(snapshot.fetchedAt) ||
    !Array.isArray(snapshot.articles) ||
    snapshot.articles.length !== 3 ||
    snapshot.articles.some((article) => !validArticle(article))
  ) {
    throw new SnapshotContractError("Snapshot schema is invalid.");
  }
  const ids = new Set(snapshot.articles.map((article) => article.id));
  if (ids.size !== 3) {
    throw new SnapshotContractError("Snapshot article IDs must be unique.");
  }
  return snapshot;
}

function snapshotState(fetchedAt, now) {
  const age = now.getTime() - new Date(fetchedAt).getTime();
  if (age > 48 * 60 * 60 * 1000) {
    return { state: "stale", warningCode: "SNAPSHOT_STALE" };
  }
  return { state: "fresh", warningCode: null };
}

export async function readSnapshot({ snapshotPath, now = () => new Date() }) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(snapshotPath, "utf8"));
    validateSnapshotObject(parsed);
  } catch (error) {
    if (error instanceof SnapshotContractError) {
      throw error;
    }
    throw new SnapshotContractError("Snapshot could not be read or parsed.");
  }
  const state = snapshotState(parsed.fetchedAt, now());
  const articles = Object.freeze(parsed.articles.map((article) => Object.freeze({ ...article })));
  return Object.freeze({
    state: state.state,
    source: "snapshot",
    fetchedAt: parsed.fetchedAt,
    articles,
    warningCode: state.warningCode,
  });
}

function validateRemoteUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new FeedFetchError("REDIRECT_FORBIDDEN", "Redirect URL is invalid.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "fazedordecodigo.substack.com" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.pathname !== "/feed"
  ) {
    throw new FeedFetchError("REDIRECT_FORBIDDEN", "Redirect host or path is not approved.");
  }
  return url.toString();
}

function contentTypeAllowed(response) {
  const value = response.headers.get("content-type") ?? "";
  const mediaType = value.split(";", 1)[0].trim().toLowerCase();
  return mediaType === "application/xml" || mediaType === "text/xml";
}

async function readLimitedBody(response) {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null && Number.isFinite(Number(contentLength)) && Number(contentLength) > MAX_FEED_BYTES) {
    throw new FeedFetchError("BODY_TOO_LARGE", "Feed body exceeds the maximum size.");
  }

  if (response.body === null) {
    return "";
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
    total += chunk.byteLength;
    if (total > MAX_FEED_BYTES) {
      await reader.cancel().catch(() => {});
      throw new FeedFetchError("BODY_TOO_LARGE", "Feed body exceeds the maximum size.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

async function requestFeed({ fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  let timedOut = false;
  let timeoutHandle;
  const operation = (async () => {
    let currentUrl = FEED_URL;
    let redirects = 0;
    while (true) {
      let response;
      try {
        response = await fetchImpl(currentUrl, {
          redirect: "manual",
          signal: controller.signal,
          headers: { accept: "application/xml, text/xml" },
        });
      } catch (error) {
        if (error instanceof FeedFetchError) {
          throw error;
        }
        throw new FeedFetchError("NETWORK", "Feed request failed.");
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirects >= MAX_REDIRECTS) {
          throw new FeedFetchError("REDIRECT_FORBIDDEN", "Too many redirects.");
        }
        const location = response.headers.get("location");
        if (location === null) {
          throw new FeedFetchError("REDIRECT_FORBIDDEN", "Redirect location is missing.");
        }
        currentUrl = validateRemoteUrl(new URL(location, currentUrl).toString());
        redirects += 1;
        continue;
      }
      if (response.status !== 200) {
        throw new FeedFetchError("HTTP_STATUS", "Feed returned an unexpected status.", { status: response.status });
      }
      if (!contentTypeAllowed(response)) {
        throw new FeedFetchError("CONTENT_TYPE", "Feed content type is not approved.", { status: response.status });
      }
      return readLimitedBody(response);
    }
  })();
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new FeedFetchError("TIMEOUT", "Feed request timed out."));
      }, timeoutMs);
    });
    return await Promise.race([
      operation,
      timeoutPromise,
    ]);
  } catch (error) {
    if (timedOut || error instanceof FeedFetchError && error.code === "TIMEOUT") {
      throw new FeedFetchError("TIMEOUT", "Feed request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
    controller.abort();
  }
}

function shouldRetry(error) {
  return error instanceof FeedFetchError && (
    error.code === "NETWORK" ||
    error.code === "TIMEOUT" ||
    error.code === "HTTP_STATUS" && (error.status === 429 || error.status >= 500)
  );
}

export async function fetchRemoteSnapshot({
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const xml = await requestFeed({ fetchImpl, timeoutMs });
      let parsed;
      try {
        parsed = parseFeed(xml);
      } catch (error) {
        if (error instanceof FeedContractError) {
          throw new FeedFetchError("REMOTE_CONTRACT", "Remote feed contract is invalid.");
        }
        throw new FeedFetchError("REMOTE_CONTRACT", "Remote feed contract is invalid.");
      }
      const fetchedAt = now().toISOString();
      const snapshot = {
        schemaVersion: 1,
        sourceUrl: FEED_URL,
        fetchedAt,
        timeZone: TIME_ZONE,
        articles: parsed.articles,
      };
      validateSnapshotObject(snapshot);
      return {
        snapshot,
        feedResult: Object.freeze({
          state: "fresh",
          source: "remote",
          fetchedAt,
          articles: parsed.articles,
          warningCode: null,
        }),
      };
    } catch (error) {
      lastError = error instanceof FeedFetchError ? error : new FeedFetchError("NETWORK", "Feed request failed.");
      if (attempt === 0 && shouldRetry(lastError)) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

export async function loadArticles({
  mode,
  snapshotPath,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  if (mode === "snapshot") {
    return readSnapshot({ snapshotPath, now });
  }
  if (mode === "remote-required") {
    return (await fetchRemoteSnapshot({ fetchImpl, now, sleep })).feedResult;
  }
  throw new FeedFetchError("REMOTE_CONTRACT", "Build mode is invalid.");
}
