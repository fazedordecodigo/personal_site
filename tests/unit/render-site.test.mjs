import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  escapeHtmlAttribute,
  escapeHtmlText,
  renderArticles,
  renderSite,
  renderTalks,
} from "../../scripts/render-site.mjs";

const hostileFeed = (overrides = {}) => ({
  state: "fresh",
  source: "snapshot",
  fetchedAt: "2026-08-15T12:17:00.000Z",
  warningCode: null,
  articles: [1, 2, 3].map((number) => ({
    id: `${number}`,
    title: number === 1 ? `A <b>& ' " </b> </style><script>` : `Fazedor de Código ${number}`,
    excerpt: number === 1 ? `E <b>& ' " </b> </style><script>` : `Resumo ${number}`,
    publishedAt: number === 1 ? "2026-08-13T00:48:38Z" : `2026-08-${String(10 + number).padStart(2, "0")}T12:00:00Z`,
    url: `https://dev.to/fazedordecodigo/hostile-${number}?ignored=1#fragment`,
    eyebrow: "Artigo",
  })),
  ...overrides,
});

const talksResult = {
  talks: [
    { tema: "Tema com <b>HTML</b>", data: "2026-10-31", evento: "Devin Meetup", local: ["Manaus"], url: null },
    { tema: "Sem evento", data: "2026-08-05", evento: null, local: ["Youtube"], url: "https://www.youtube.com/watch?v=bBt4K-ZmNt4" },
  ],
};

test("escapes text and attribute contexts independently", () => {
  assert.equal(escapeHtmlText(`<>&'"`), "&lt;&gt;&amp;'\"");
  assert.equal(escapeHtmlAttribute(`<>&'"`), "&lt;&gt;&amp;&#39;&quot;");
});

test("renders three safely escaped rows with canonical links and local dates", () => {
  const html = renderArticles(hostileFeed());
  assert.equal((html.match(/class="article-row"/g) ?? []).length, 3);
  assert.ok(html.includes(`A &lt;b&gt;&amp; ' " &lt;/b&gt; &lt;/style&gt;&lt;script&gt;`));
  assert.doesNotMatch(html, /<b>|<script>|<\/style>/);
  assert.match(html, /datetime="2026-08-13T00:48:38\.000Z"/);
  assert.match(html, />12 ago\. 2026</);
  assert.match(html, /href="https:\/\/dev\.to\/fazedordecodigo\/hostile-1"/);
  assert.doesNotMatch(html, /ignored=1|fragment/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, />Artigo</);
});

test("renders capture metadata and stale warning at the strict boundary", () => {
  const fresh = renderArticles(hostileFeed());
  assert.match(fresh, /Última atualização: 15\/08\/2026 às 09:17 \(America\/Sao_Paulo\)\./);
  assert.doesNotMatch(fresh, /Conteúdo preservado/);
  const stale = renderArticles(hostileFeed({ state: "stale", warningCode: "SNAPSHOT_STALE" }));
  assert.match(stale, /Conteúdo preservado; a última atualização tem mais de 48 horas\./);
});

test("renders talks with date, local, optional evento and optional link", () => {
  const html = renderTalks(talksResult);
  assert.match(html, /datetime="2026-10-31"/);
  assert.match(html, />31\/10\/2026</);
  assert.match(html, /Manaus/);
  assert.match(html, /Tema com &lt;b&gt;HTML&lt;\/b&gt;/);
  assert.match(html, /Devin Meetup/);
  assert.doesNotMatch(html.split("Sem evento")[0] ?? "", /Ver palestra/);
  assert.match(html, /href="https:\/\/www\.youtube\.com\/watch\?v=bBt4K-ZmNt4"/);
  assert.doesNotMatch(html, /null/);
});

test("replaces exactly one article slot and one talks slot", async () => {
  const feedResult = hostileFeed();
  const template = await readFile(new URL("../../src/index.template.html", import.meta.url), "utf8");
  const rendered = renderSite({ template, feedResult, talksResult });
  assert.equal(rendered.includes("<!-- ARTICLES_SLOT -->"), false);
  assert.equal(rendered.includes("<!-- TALKS_SLOT -->"), false);
  assert.equal((rendered.match(/article-row/g) ?? []).length, 3);
  assert.throws(() => renderSite({ template: "<main></main>", feedResult, talksResult }), /TALKS_SLOT|ARTICLE_SLOT/);
  assert.throws(() => renderSite({ template: "<!-- TALKS_SLOT --><!-- ARTICLES_SLOT --><!-- ARTICLES_SLOT -->", feedResult, talksResult }), /ARTICLE_SLOT/);
});
