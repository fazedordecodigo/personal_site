import {
  ARTICLE_EYEBROWS,
  ARTICLE_HOST,
  ARTICLE_PATH_PREFIX,
  EXCERPT_LIMIT,
  TITLE_LIMIT,
} from "./constants.mjs";

const DISCARDED_BY_CODE = Object.freeze({
  FIELD_INVALID: 0,
  URL_FORBIDDEN: 0,
  DATE_INVALID: 0,
  DUPLICATE_CONFLICT: 0,
  DUPLICATE_IDENTICAL: 0,
});

export class FeedContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FeedContractError";
    this.code = code;
  }
}

function normalizeWhitespace(value) {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function truncateCodePoints(value, limit) {
  return Array.from(value).slice(0, limit).join("");
}

function compareCodePoints(left, right) {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0));
  const rightPoints = Array.from(right, (character) => character.codePointAt(0));
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) {
      return leftPoints[index] - rightPoints[index];
    }
  }
  return leftPoints.length - rightPoints.length;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeArticleUrl(rawLink) {
  if (typeof rawLink !== "string") {
    return null;
  }
  let url;
  try {
    url = new URL(rawLink.trim());
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== ARTICLE_HOST ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    !url.pathname.startsWith(ARTICLE_PATH_PREFIX)
  ) {
    return null;
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

function normalizeItem(item, diagnostics) {
  if (!isRecord(item)) {
    diagnostics.FIELD_INVALID += 1;
    return null;
  }

  const title = typeof item.title === "string" ? truncateCodePoints(normalizeWhitespace(item.title), TITLE_LIMIT) : "";
  const excerptSource = typeof item.description === "string" ? item.description : "";
  const excerpt = truncateCodePoints(normalizeWhitespace(excerptSource), EXCERPT_LIMIT);
  const rawId = item.id === undefined || item.id === null ? "" : String(item.id).normalize("NFC").trim();
  if (Array.from(rawId).length === 0 || Array.from(rawId).length > 2048 || title.length === 0 || excerpt.length === 0) {
    diagnostics.FIELD_INVALID += 1;
    return null;
  }

  const url = normalizeArticleUrl(item.url);
  if (url === null) {
    diagnostics.URL_FORBIDDEN += 1;
    return null;
  }

  const dateValue = typeof item.published_at === "string" ? item.published_at : typeof item.publishedAt === "string" ? item.publishedAt : "";
  const date = new Date(dateValue.trim());
  if (Number.isNaN(date.getTime())) {
    diagnostics.DATE_INVALID += 1;
    return null;
  }

  return Object.freeze({
    id: rawId,
    title,
    excerpt,
    publishedAt: date.toISOString(),
    url,
    eyebrow: ARTICLE_EYEBROWS[0],
  });
}

export function parseFeed(jsonText) {
  if (typeof jsonText !== "string") {
    throw new FeedContractError("JSON_INVALID", "Feed JSON must be a string.");
  }

  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch {
    throw new FeedContractError("JSON_INVALID", "Feed JSON is not well formed.");
  }

  if (!Array.isArray(payload)) {
    throw new FeedContractError("JSON_INVALID", "Feed JSON must be an array.");
  }

  const diagnostics = {
    totalItems: payload.length,
    acceptedBeforeLimit: 0,
    discardedByCode: { ...DISCARDED_BY_CODE },
  };
  const normalizedItems = [];
  for (const item of payload) {
    const article = normalizeItem(item, diagnostics.discardedByCode);
    if (article !== null) {
      normalizedItems.push(article);
    }
  }

  const groups = new Map();
  for (const article of normalizedItems) {
    const group = groups.get(article.id);
    if (group === undefined) {
      groups.set(article.id, { article, conflict: false });
    } else if (JSON.stringify(group.article) === JSON.stringify(article) && !group.conflict) {
      diagnostics.discardedByCode.DUPLICATE_IDENTICAL += 1;
    } else {
      group.conflict = true;
    }
  }

  const uniqueItems = [];
  for (const group of groups.values()) {
    if (group.conflict) {
      diagnostics.discardedByCode.DUPLICATE_CONFLICT += 1;
    } else {
      uniqueItems.push(group.article);
    }
  }
  diagnostics.acceptedBeforeLimit = uniqueItems.length;
  uniqueItems.sort((left, right) => {
    const dateOrder = right.publishedAt.localeCompare(left.publishedAt);
    return dateOrder === 0 ? compareCodePoints(left.id, right.id) : dateOrder;
  });

  if (uniqueItems.length < 3) {
    throw new FeedContractError("ITEMS_INSUFFICIENT", "Feed does not contain three valid unique articles.");
  }

  const articles = Object.freeze(uniqueItems.slice(0, 3));
  return Object.freeze({
    articles,
    diagnostics: Object.freeze({
      totalItems: diagnostics.totalItems,
      acceptedBeforeLimit: diagnostics.acceptedBeforeLimit,
      discardedByCode: Object.freeze(diagnostics.discardedByCode),
    }),
  });
}
