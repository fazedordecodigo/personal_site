import { parseFragment } from "parse5";
import { SaxesParser } from "saxes";

import {
  ARTICLE_EYEBROWS,
  EXCERPT_LIMIT,
  TITLE_LIMIT,
} from "./constants.mjs";

const ITEM_FIELDS = new Set(["title", "description", "link", "guid", "pubdate"]);

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

function textFromHtmlFragment(value) {
  const fragment = parseFragment(value);
  const textParts = [];

  const visit = (node) => {
    if (node.nodeName === "#text") {
      textParts.push(node.value);
      return;
    }
    for (const child of node.childNodes ?? []) {
      visit(child);
    }
  };

  visit(fragment);
  return normalizeWhitespace(textParts.join(" "));
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

function deriveEyebrow(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.startsWith("cursor weekly")) {
    return ARTICLE_EYEBROWS[0];
  }
  if (lowerTitle.startsWith("devin weekly")) {
    return ARTICLE_EYEBROWS[1];
  }
  return ARTICLE_EYEBROWS[2];
}

function normalizeUrl(rawLink) {
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
    url.hostname !== "fazedordecodigo.substack.com" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    !url.pathname.startsWith("/p/")
  ) {
    return null;
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

function normalizeItem(item, diagnostics) {
  const title = typeof item.title === "string" ? truncateCodePoints(normalizeWhitespace(item.title), TITLE_LIMIT) : "";
  const excerpt = typeof item.description === "string" ? truncateCodePoints(textFromHtmlFragment(item.description), EXCERPT_LIMIT) : "";
  const rawId = typeof item.guid === "string" ? item.guid.normalize("NFC").trim() : "";
  if (Array.from(rawId).length === 0 || Array.from(rawId).length > 2048 || title.length === 0 || excerpt.length === 0) {
    diagnostics.FIELD_INVALID += 1;
    return null;
  }

  const url = normalizeUrl(item.link);
  if (url === null) {
    diagnostics.URL_FORBIDDEN += 1;
    return null;
  }

  const date = typeof item.pubdate === "string" ? new Date(item.pubdate.trim()) : new Date(NaN);
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
    eyebrow: deriveEyebrow(title),
  });
}

function collectItems(xmlText) {
  if (typeof xmlText !== "string") {
    throw new FeedContractError("XML_INVALID", "Feed XML must be a string.");
  }
  if (/<!\s*(?:doctype|entity)\b/iu.test(xmlText)) {
    throw new FeedContractError("DTD_FORBIDDEN", "DTD and entity declarations are forbidden.");
  }

  const items = [];
  let currentItem = null;
  let currentField = null;
  let currentFieldText = [];
  let parseError = null;
  const parser = new SaxesParser({ xmlns: false });

  parser.on("error", (error) => {
    parseError ??= error;
  });
  parser.on("opentag", (tag) => {
    const name = tag.name.toLowerCase();
    if (name === "item" && currentItem === null) {
      currentItem = {};
      currentField = null;
      currentFieldText = [];
      return;
    }
    if (currentItem !== null && ITEM_FIELDS.has(name)) {
      currentField = name;
      currentFieldText = [];
    }
  });
  const appendText = (value) => {
    if (currentItem !== null && currentField !== null) {
      currentFieldText.push(value);
    }
  };
  parser.on("text", appendText);
  parser.on("cdata", appendText);
  parser.on("closetag", (tag) => {
    const name = (typeof tag === "string" ? tag : tag.name).toLowerCase();
    if (currentItem !== null && currentField === name) {
      currentItem[currentField] = currentFieldText.join("");
      currentField = null;
      currentFieldText = [];
    }
    if (name === "item" && currentItem !== null) {
      items.push(currentItem);
      currentItem = null;
      currentField = null;
      currentFieldText = [];
    }
  });

  try {
    parser.write(xmlText).close();
  } catch (error) {
    if (error instanceof FeedContractError) {
      throw error;
    }
    parseError ??= error;
  }
  if (parseError !== null) {
    throw new FeedContractError("XML_INVALID", "Feed XML is not well formed.");
  }
  return items;
}

export function parseFeed(xmlText) {
  const rawItems = collectItems(xmlText);
  const diagnostics = {
    totalItems: rawItems.length,
    acceptedBeforeLimit: 0,
    discardedByCode: { ...DISCARDED_BY_CODE },
  };
  const normalizedItems = [];
  for (const item of rawItems) {
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
