import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const template = await readFile(new URL("../../src/index.template.html", import.meta.url), "utf8");
const talks = JSON.parse(await readFile(new URL("../../content/talks.snapshot.json", import.meta.url), "utf8"));
const html = await readFile(new URL("../../public/index.html", import.meta.url), "utf8");

const staticCopy = [
  "Início",
  "Quem é",
  "Comunidade",
  "Eventos",
  "Palestras",
  "Artigos",
  "Newsletter",
  "Contato",
  "DELATORRE_",
  "Engenharia · Comunidade · Palco",
  "SpaceXAI Ambassador",
  "Devin Ambassador",
  "N8N Ambassador",
  "Senior Python Software Engineer — Zup Innovation · desde set/2026",
  "Construo software. Lidero comunidade. Falo no palco.",
  "Como Senior Python Software Engineer na Zup Innovation, aplico Python e arquitetura de software para desenvolver soluções robustas. Lidero a Fazedor de Código, falo em encontros sobre qualidade, agentes e engenharia com IA, e mantenho software aberto — sem transformar esta página num currículo.",
  "Forward Deployed Engineer | SpaceXAI Ambassador | Devin Ambassador | N8N Ambassador | Community &amp; Education | Fazedor de Código Leader | Speaker | OSS Contributor",
  "Ver palestras e eventos",
  "Vamos conversar",
  "Retrato de Emerson Delatorre",
  "Emerson Delatorre",
  "Zup Innovation",
  "Senior Python Software Engineer",
  "Fazedor de Código",
  "Líder de comunidade",
  "Palco",
  "Palestras, painéis e meetups",
  "PyFlunt",
  "OSS · Domain Notification Pattern",
  "01 · Quem é",
  "Profissional, professor e palestrante",
  "Esta vitrine apresenta o trabalho atual, o ensino e a comunidade. Não é uma linha do tempo de cargos.",
  "Quem é Emerson Delatorre",
  "Engenharia na Zup, aula na FIAP",
  "Senior Python Software Engineer na Zup Innovation desde set/2026. Professor na FIAP desde jan/2024, com treinamentos corporativos em .NET, GenAI e Python. O ponto é prática: software real, clareza e o que dá para ensinar.",
  "Python",
  "Arquitetura",
  "GenAI",
  ".NET",
  "Comunidade",
  "Palco",
  "Open source em destaque",
  "Biblioteca Python do Domain Notification Pattern, publicada no PyPI como Flunt. É o destaque de software aberto desta vitrine — não um portfólio completo.",
  "Ver PyFlunt no GitHub",
  "02 · Comunidade",
  "Líder da Fazedor de Código",
  "A comunidade é um espaço próprio: encontros, materiais e uma rede para quem constrói software com mais clareza. O site pessoal aponta para ela; não a substitui.",
  "Logo oficial da comunidade Fazedor de Código",
  "Comunidade oficial",
  "Encontros, ensino e software aberto",
  "Emerson lidera a Fazedor de Código. A marca, o site e a programação da comunidade ficam em fazedordecodigo.com.",
  "Visitar fazedordecodigo.com",
  "03 · Eventos",
  "Agenda no Luma",
  "Os encontros que organizo e os da comunidade ficam no mesmo calendário do Luma usado em fazedordecodigo.com. Confirme presença por lá.",
  "Abrir agenda no Luma",
  "04 · Palestras",
  "Quatorze registros da coleção Conteúdos no Notion, com Tipo contendo Palestra, da data mais recente para a mais antiga. Tema, data, evento, local e o link saem do snapshot revisável.",
  "Ver mais no Sessionize",
  "05 · Certificações",
  "Credenciais ativas nesta vitrine",
  "Somente certificações ativas aprovadas para o site. Certificações vencidas ou de outros emissores ficam de fora.",
  "AI-900 — Microsoft Azure AI Fundamentals",
  "ID I733-9928",
  "AZ-900 — Azure Fundamentals",
  "ID I615-0975",
  "DP-900 — Azure Data Fundamentals",
  "ID I156-7274",
  "SC-900 — Security, Compliance, and Identity Fundamentals",
  "ID I653-8687",
  "PL-900 — Power Platform Fundamentals",
  "ID I721-1845",
  "MS-900 — Microsoft 365 Fundamentals",
  "ID 3A1C6D54AC341DE0",
  "GitHub Foundations",
  "Expira",
  "mar/2027",
  "06 · Artigos",
  "Artigos no dev.to",
  "Três publicações recentes do perfil Fazedor de Código no dev.to, no mesmo formato da lista de fazedordecodigo.com.",
  "Artigos · dev.to",
  "Ver todos os artigos no dev.to →",
  "Newsletter · secundária",
  "Receba o Fazedor de Código no e-mail",
  "A assinatura da newsletter é um canal extra, não o convite principal desta página. Carregue o formulário somente se quiser interagir com o Substack. A moldura pertence a esta página; o conteúdo interno, a coleta e os estados do formulário pertencem ao terceiro.",
  "Substack · click-to-load",
  "O terceiro ainda não foi solicitado",
  "Ao continuar, o navegador solicitará o formulário ao Substack, que pode carregar cookies, telemetria e outros recursos de terceiros. Nenhuma inscrição é enviada automaticamente.",
  "Carregar formulário do Substack",
  "Assinar no Substack",
  "Formulário não oferecido nesta largura. Use o link Assinar no Substack.",
  "Vamos construir algo que valha a pena compartilhar?",
  "Code. Compartilhe. Construa. Impacte.",
];

test("template contains every approved static string and canonical destination", () => {
  for (const text of staticCopy) assert.ok(template.includes(text), `missing static copy: ${text}`);
  for (const url of [
    "https://www.linkedin.com/in/fazedordecodigo/",
    "https://github.com/fazedordecodigo",
    "https://github.com/fazedordecodigo/PyFlunt",
    "https://fazedordecodigo.com",
    "https://fazedordecodigo.substack.com/",
    "https://fazedordecodigo.substack.com/embed",
    "https://luma.com/embed/calendar/cal-ySWMeFE0nNFt5kA/events",
    "https://sessionize.com/emerson-delatorre/",
    "https://dev.to/fazedordecodigo",
  ]) assert.ok(template.includes(url), `missing URL: ${url}`);
  assert.match(template, /href="#palestras"[^>]*>Ver palestras e eventos</);
  assert.match(template, /href="https:\/\/www\.linkedin\.com\/in\/fazedordecodigo\/"[^>]*>Vamos conversar</);
  assert.match(template, /href="https:\/\/fazedordecodigo\.com"[^>]*>Visitar fazedordecodigo\.com</);
  assert.equal(template.includes("EMERSON_"), false);
  for (const forbidden of ["PROTÓTIPO", "image-fallback", "?state=", "carrossel", "AllOrigins", "SociableKit", "noindex", "event-grid", "Tema a definir. Organização."]) {
    assert.equal(template.includes(forbidden), false, `forbidden token: ${forbidden}`);
  }
});

test("official ambassador titles are isolated English spans with local logos and exclude Cursor", () => {
  assert.match(template, /<span[^>]*lang="en"[^>]*>[\s\S]*SpaceXAI Ambassador<\/span>/);
  assert.match(template, /<span[^>]*lang="en"[^>]*>[\s\S]*Devin Ambassador<\/span>/);
  assert.match(template, /<span[^>]*lang="en"[^>]*>[\s\S]*N8N Ambassador<\/span>/);
  assert.match(template, /src="\/assets\/images\/logo-spacexai\.svg"/);
  assert.match(template, /src="\/assets\/images\/logo-devin\.svg"/);
  assert.match(template, /src="\/assets\/images\/logo-n8n\.svg"/);
  assert.equal(template.includes("Cursor Ambassador"), false);
});

test("keeps the closed certification set and excludes expired or extra credentials", () => {
  assert.equal(template.includes("PL-100"), false);
  assert.equal(template.includes("Luizalabs"), false);
  assert.equal(template.includes("Vibra Digital"), false);
  assert.equal((template.match(/AI-900/g) ?? []).length, 1);
  assert.equal((template.match(/AZ-900/g) ?? []).length, 1);
  assert.equal((template.match(/DP-900/g) ?? []).length, 1);
  assert.equal((template.match(/SC-900/g) ?? []).length, 1);
  assert.equal((template.match(/PL-900/g) ?? []).length, 1);
  assert.equal((template.match(/MS-900/g) ?? []).length, 1);
  assert.equal((template.match(/GitHub Foundations/g) ?? []).length, 1);
});

test("built talks section contains exactly the 14 snapshot rows", () => {
  assert.equal(talks.count, 14);
  assert.equal(talks.talks.length, 14);
  assert.equal((html.match(/class="talk-item"/g) ?? []).length, 14);
  for (const talk of talks.talks) {
    assert.ok(html.includes(talk.tema), `missing talk tema: ${talk.tema}`);
    if (talk.evento !== null) assert.ok(html.includes(talk.evento), `missing talk evento: ${talk.evento}`);
    for (const place of talk.local) assert.ok(html.includes(place), `missing talk local: ${place}`);
    if (talk.url !== null) assert.ok(html.includes(talk.url), `missing talk url: ${talk.url}`);
  }
  assert.equal(html.includes("Painel Cidade 5.0"), false);
  assert.equal(html.includes("Cybersecurity Summit Rio"), false);
});
