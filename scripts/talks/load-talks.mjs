import { readFile } from "node:fs/promises";

const SNAPSHOT_KEYS = ["source", "filter", "fetched_at", "count", "talks"];
const TALK_KEYS = ["tema", "data", "evento", "local", "url", "tipo", "notion"];
const EXPECTED_COUNT = 14;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class TalksSnapshotError extends Error {
  constructor(message) {
    super(message);
    this.name = "TalksSnapshotError";
    this.code = "TALKS_SNAPSHOT_INVALID";
  }
}

function exactKeys(value, expected) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpsUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.username === "" && url.password === "" && url.port === "";
}

function validTalk(talk) {
  if (!exactKeys(talk, TALK_KEYS)) {
    return false;
  }
  if (!isNonEmptyString(talk.tema) || !DATE_PATTERN.test(talk.data) || Number.isNaN(new Date(`${talk.data}T00:00:00Z`).getTime())) {
    return false;
  }
  if (!(talk.evento === null || isNonEmptyString(talk.evento))) {
    return false;
  }
  if (!Array.isArray(talk.local) || talk.local.length === 0 || talk.local.some((place) => !isNonEmptyString(place))) {
    return false;
  }
  if (!(talk.url === null || (typeof talk.url === "string" && isHttpsUrl(talk.url)))) {
    return false;
  }
  if (!Array.isArray(talk.tipo) || talk.tipo.length === 0 || talk.tipo.some((value) => !isNonEmptyString(value)) || !talk.tipo.includes("Palestra")) {
    return false;
  }
  return isNonEmptyString(talk.notion);
}

export function validateTalksSnapshot(snapshot) {
  if (
    !exactKeys(snapshot, SNAPSHOT_KEYS) ||
    !isNonEmptyString(snapshot.source) ||
    !isNonEmptyString(snapshot.filter) ||
    !isNonEmptyString(snapshot.fetched_at) ||
    snapshot.count !== EXPECTED_COUNT ||
    !Array.isArray(snapshot.talks) ||
    snapshot.talks.length !== EXPECTED_COUNT ||
    snapshot.talks.some((talk) => !validTalk(talk))
  ) {
    throw new TalksSnapshotError("Talks snapshot schema is invalid.");
  }
  return snapshot;
}

export async function loadTalks({ snapshotPath }) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(snapshotPath, "utf8"));
    validateTalksSnapshot(parsed);
  } catch (error) {
    if (error instanceof TalksSnapshotError) {
      throw error;
    }
    throw new TalksSnapshotError("Talks snapshot could not be read or parsed.");
  }
  const talks = Object.freeze(parsed.talks.map((talk) => Object.freeze({
    tema: talk.tema,
    data: talk.data,
    evento: talk.evento,
    local: Object.freeze([...talk.local]),
    url: talk.url,
    tipo: Object.freeze([...talk.tipo]),
    notion: talk.notion,
  })));
  return Object.freeze({
    source: parsed.source,
    filter: parsed.filter,
    fetchedAt: parsed.fetched_at,
    count: parsed.count,
    talks,
  });
}
