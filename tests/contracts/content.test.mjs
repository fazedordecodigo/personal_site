import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const template = await readFile(new URL("../../src/index.template.html", import.meta.url), "utf8");

const staticCopy = [
  "Início",
  "Perfil",
  "Artigos",
  "Newsletter",
  "Contato",
  "EMERSON_",
  "Engenharia de software · IA · Educação",
  "Cursor Ambassador",
  "Devin Ambassador",
  "Construo software. Ensino o processo. Compartilho o que funciona.",
  "Atuo na interseção entre engenharia de software e inteligência artificial. No Fazedor de Código, transformo prática em software aberto, materiais de ensino, artigos e encontros para quem quer construir com mais clareza, qualidade e segurança.",
  "Assinar o Fazedor de Código",
  "Vamos conversar",
  "Retrato de Emerson Delatorre",
  "Emerson Delatorre",
  "Engenharia + IA",
  "Software, agentes e qualidade",
  "PyFlunt",
  "Open source em Python",
  "Ensino prático",
  "Materiais, workshops e palestras",
  "Fazedor de Código",
  "Newsletter, artigos e comunidade",
  "01 · Perfil",
  "Engenharia, ensino e IA na mesma trajetória",
  "Projetos públicos, materiais didáticos, artigos e encontros formam o mesmo ciclo: construir, testar, explicar e melhorar com a comunidade.",
  "Como eu trabalho",
  "Prática primeiro, clareza sempre",
  "O ponto de partida é o software real. A partir dele, organizo processos, compartilho decisões e transformo aprendizado em material que outras pessoas conseguem usar.",
  "Agentes de IA",
  "Arquitetura",
  "Qualidade",
  "Open source",
  "Frente editorial",
  "Fazedor de Código",
  "A página é de Emerson. O Fazedor de Código reúne newsletter, artigos e comunidade — e concentra a assinatura principal sem competir com a marca pessoal.",
  "02 · Artigos",
  "Ideias recentes, direto do Substack",
  "Três publicações recentes do Fazedor de Código, atualizadas a partir do feed oficial do Substack.",
  "Ver todos os artigos no Substack",
  "Fazedor de Código",
  "Receba o que vale a pena ler",
  "Carregue o formulário somente se quiser interagir com o Substack. A moldura pertence a esta página; o conteúdo interno, a coleta e os estados do formulário pertencem ao terceiro.",
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
    "https://fazedordecodigo.substack.com/",
    "https://fazedordecodigo.substack.com/embed",
  ]) assert.ok(template.includes(url), `missing URL: ${url}`);
  assert.match(template, /href="https:\/\/www\.linkedin\.com\/in\/fazedordecodigo\/"[^>]*>Vamos conversar</);
  for (const forbidden of ["PROTÓTIPO", "image-fallback", "?state=", "carrossel", "AllOrigins", "SociableKit", "noindex"]) {
    assert.equal(template.includes(forbidden), false, `forbidden token: ${forbidden}`);
  }
});

test("official ambassador titles are isolated English spans", () => {
  assert.match(template, /<span[^>]*lang="en"[^>]*>Cursor Ambassador<\/span>/);
  assert.match(template, /<span[^>]*lang="en"[^>]*>Devin Ambassador<\/span>/);
});
