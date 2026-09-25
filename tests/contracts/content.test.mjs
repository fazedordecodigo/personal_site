import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const template = await readFile(new URL("../../src/index.template.html", import.meta.url), "utf8");

const staticCopy = [
  "Início",
  "Quem é",
  "Comunidade",
  "Eventos",
  "Palestras",
  "Artigos",
  "Newsletter",
  "Contato",
  "EMERSON_",
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
  "Eventos que organizo",
  "Cinco encontros com papel de organização. Nome de meetup — por exemplo Cursor Meetup — descreve o evento, não um título de embaixador.",
  "31/10/2026",
  "Manaus",
  "Devin Meetup",
  "Tema a definir. Organização.",
  "26/09/2026",
  "Rio de Janeiro / FIAP",
  "Organização.",
  "Abrir Devin Meetup no Luma",
  "22/09/2026",
  "Salvador / Espaço SIC",
  "Codecon Meetup Salvador #3",
  "Organização e apoio Devin.",
  "08/08/2026",
  "Cursor Meetup",
  "11/07/2026",
  "Rio de Janeiro / BQ Coworking",
  "Organização e palestra.",
  "Abrir Cursor Meetup no Luma",
  "04 · Palestras",
  "Palestras e painéis",
  "Oito destaques recentes. A lista completa desta vitrine fica em Ver mais palestras. Títulos e datas vêm da agenda fechada; nada foi inventado.",
  "24/09/2026",
  "TDC São Paulo",
  "Qualidade de Código com Agentes…",
  "19/09/2026",
  "Tech Summit Rio",
  "29/08/2026",
  "IEEE Computer Society (UERJ)",
  "SDD e o Fim do “Vibe Coding”…",
  "MVP Conf RJ",
  "18/08/2026",
  "AWS Meetup RJ",
  "…com Kiro",
  "07/08/2026",
  "SUCESU-SP (Zoom)",
  "IA para Conselheiros",
  "06/08/2026",
  "Rio Innovation Week",
  "Painel Cidade 5.0",
  "05/08/2026",
  "YouTube live",
  "SDD…",
  "Ver mais palestras",
  "07/07/2026",
  "GDG Rio",
  "01/07/2026",
  "Cybersecurity Summit Rio",
  "Painel Aplicação, Mercado e Futuro",
  "27/06/2026",
  "FIAP Reboot Experience",
  "Primeiros Passos técnicos em IA",
  "13/06/2026",
  "Agentcon Rio",
  "28/02/2026",
  "Codecon Meetup Rio",
  "A Ascensão dos Agentes…",
  "Qualidade de Código…",
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
  "Ideias recentes, direto do Substack",
  "Três publicações recentes do Fazedor de Código, atualizadas a partir do feed oficial do Substack.",
  "Ver todos os artigos no Substack",
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
    "https://luma.com/l2f11j2p",
    "https://luma.com/45jawdhf",
    "https://sessionize.com/emerson-delatorre/",
  ]) assert.ok(template.includes(url), `missing URL: ${url}`);
  assert.match(template, /href="#palestras"[^>]*>Ver palestras e eventos</);
  assert.match(template, /href="https:\/\/www\.linkedin\.com\/in\/fazedordecodigo\/"[^>]*>Vamos conversar</);
  assert.match(template, /href="https:\/\/fazedordecodigo\.com"[^>]*>Visitar fazedordecodigo\.com</);
  for (const forbidden of ["PROTÓTIPO", "image-fallback", "?state=", "carrossel", "AllOrigins", "SociableKit", "noindex"]) {
    assert.equal(template.includes(forbidden), false, `forbidden token: ${forbidden}`);
  }
});

test("official ambassador titles are isolated English spans and exclude Cursor", () => {
  assert.match(template, /<span[^>]*lang="en"[^>]*>SpaceXAI Ambassador<\/span>/);
  assert.match(template, /<span[^>]*lang="en"[^>]*>Devin Ambassador<\/span>/);
  assert.match(template, /<span[^>]*lang="en"[^>]*>N8N Ambassador<\/span>/);
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
