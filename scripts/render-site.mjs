import { readFile } from "node:fs/promises";

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

function canonicalArticleUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "fazedordecodigo.substack.com" || url.username !== "" || url.password !== "" || url.port !== "" || !url.pathname.startsWith("/p/")) {
    throw new Error("Article URL is not permitted.");
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function renderArticles(feedResult) {
  const cards = feedResult.articles.map((article) => {
    const publishedAt = new Date(article.publishedAt).toISOString();
    const url = canonicalArticleUrl(article.url);
    return `<article class="article-card"><p class="card-kicker">${escapeHtmlText(article.eyebrow)}</p><h3>${escapeHtmlText(article.title)}</h3><p>${escapeHtmlText(article.excerpt)}</p><time datetime="${escapeHtmlAttribute(publishedAt)}">${escapeHtmlText(formatArticleDate(publishedAt))}</time><a class="text-link" href="${escapeHtmlAttribute(url)}">Ler no Substack →</a></article>`;
  }).join("");
  const updated = `<div class="article-meta"><p>${escapeHtmlText(formatCaptureDate(feedResult.fetchedAt))}</p>${feedResult.warningCode === "SNAPSHOT_STALE" ? "<p class=\"stale-warning\">Conteúdo preservado; a última atualização tem mais de 48 horas.</p>" : ""}</div>`;
  return `${updated}${cards}`;
}

export function renderSite({ template, feedResult }) {
  const token = "<!-- ARTICLES_SLOT -->";
  const occurrences = template.split(token).length - 1;
  if (occurrences !== 1) {
    throw new Error("ARTICLE_SLOT must occur exactly once.");
  }
  return template.replace(token, renderArticles(feedResult));
}

export async function readTemplate(templatePath) {
  return readFile(templatePath, "utf8");
}
