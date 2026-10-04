import { readFile } from "node:fs/promises";

import { normalizeArticleUrl } from "./articles/parse-feed.mjs";

const TIME_ZONE = "America/Sao_Paulo";
const MONTHS = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

export function escapeHtmlText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function escapeHtmlAttribute(value) {
  return escapeHtmlText(value).replaceAll("'", "&#39;").replaceAll("\"", "&quot;");
}

function partsFor(dateValue, options) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...options }).formatToParts(new Date(dateValue)).map((part) => [part.type, part.value]));
}

function formatArticleDate(dateValue) {
  const parts = partsFor(dateValue, { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${Number(parts.day)} ${MONTHS[Number(parts.month) - 1]} ${parts.year}`;
}

function formatCaptureDate(dateValue) {
  const parts = partsFor(dateValue, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `Última atualização: ${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute} (${TIME_ZONE}).`;
}

function formatTalkDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function renderArticles(feedResult) {
  const rows = feedResult.articles.map((article) => {
    const publishedAt = new Date(article.publishedAt).toISOString();
    const url = normalizeArticleUrl(article.url);
    if (url === null) {
      throw new Error("Article URL is not permitted.");
    }
    return `<div class="article-row"><div><h3><a class="text-link" href="${escapeHtmlAttribute(url)}">${escapeHtmlText(article.title)}</a></h3><p>${escapeHtmlText(article.excerpt)}</p><time datetime="${escapeHtmlAttribute(publishedAt)}">${escapeHtmlText(formatArticleDate(publishedAt))}</time></div><span class="tag">${escapeHtmlText(article.eyebrow)}</span></div>`;
  }).join("");
  const updated = `<div class="article-meta"><p>${escapeHtmlText(formatCaptureDate(feedResult.fetchedAt))}</p>${feedResult.warningCode === "SNAPSHOT_STALE" ? "<p class=\"stale-warning\">Conteúdo preservado; a última atualização tem mais de 48 horas.</p>" : ""}</div>`;
  return `${updated}${rows}`;
}

export function renderTalks(talksResult) {
  return talksResult.talks.map((talk) => {
    const local = talk.local.join(" / ");
    const kicker = `<time datetime="${escapeHtmlAttribute(talk.data)}">${escapeHtmlText(formatTalkDate(talk.data))}</time> · ${escapeHtmlText(local)}`;
    const evento = talk.evento === null ? "" : `<p>${escapeHtmlText(talk.evento)}</p>`;
    const link = talk.url === null ? "" : `<a class="text-link" href="${escapeHtmlAttribute(talk.url)}">Ver palestra</a>`;
    return `<li><article class="talk-item"><p class="card-kicker">${kicker}</p><h3>${escapeHtmlText(talk.tema)}</h3>${evento}${link}</article></li>`;
  }).join("");
}

function replaceUniqueToken(template, token, replacement, label) {
  const occurrences = template.split(token).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label} must occur exactly once.`);
  }
  return template.replace(token, replacement);
}

export function renderSite({ template, feedResult, talksResult }) {
  const withTalks = replaceUniqueToken(template, "<!-- TALKS_SLOT -->", renderTalks(talksResult), "TALKS_SLOT");
  return replaceUniqueToken(withTalks, "<!-- ARTICLES_SLOT -->", renderArticles(feedResult), "ARTICLE_SLOT");
}

export async function readTemplate(templatePath) {
  return readFile(templatePath, "utf8");
}
