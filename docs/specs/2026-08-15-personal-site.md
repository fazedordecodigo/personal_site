# Site pessoal de Emerson Delatorre — especificação consolidada

- **Status:** aprovada em Q13 para futura implementação
- **Data-base:** 2026-08-15
- **Ticket:** [#11 — consolidar especificação pronta para implementação](https://github.com/fazedordecodigo/personal_site/issues/11)
- **Limite:** este documento especifica a implementação futura. Ele não autoriza implementação, preview externo, deploy nem publicação.

## 1. Resultado esperado

Entregar uma página pessoal estática, única e em PT-BR para Emerson Delatorre. A página apresenta autoridade profissional em engenharia de software, inteligência artificial e educação; usa o retrato real como foco; e conduz prioritariamente à assinatura do Fazedor de Código no Substack.

Q13 aprovou este documento em 2026-08-15; o resultado está **pronto para implementar em uma etapa futura**. A implementação só fica **pronta para autorizar produção** depois dos gates pré-deploy da seção 16; o lançamento só é considerado concluído após a verificação operacional imediatamente posterior a um deploy de produção autorizado separadamente.

## 2. Fontes e ordem de autoridade

Em caso de divergência, vale a seguinte ordem:

1. decisões humanas registradas nos tickets [#9](https://github.com/fazedordecodigo/personal_site/issues/9), [#14](https://github.com/fazedordecodigo/personal_site/issues/14) e [#8](https://github.com/fazedordecodigo/personal_site/issues/8);
2. esta especificação, aprovada em Q13;
3. o [mapa Wayfinder #6](https://github.com/fazedordecodigo/personal_site/issues/6), como contexto consolidado sujeito às aprovações posteriores acima;
4. a [referência visual aprovada e durável](../reference/2026-08-15-personal-site-design-reference.md);
5. o protótipo responsivo v3, SHA-256 `a8afe3888e4fed6c200de65c59e743bf895f49a0b26e7e1cb9d9bb4413d54c25`, somente como proveniência descartável da decisão, não como dependência de checkout nem código de produção;
6. as pesquisas de [perfil](../research/2026-08-15-profile-evidence.md), [Substack](../research/2026-08-15-substack-integration.md) e [arquitetura estática](../research/2026-08-15-static-site-architecture.md);
7. o site legado, somente como inventário do que deve ser substituído.

Decisões posteriores substituem recomendações anteriores. Em especial:

- `click-to-load` substitui iframe com `src` inicial ou lazy-load automático;
- cards textuais substituem capas, logos e fallbacks de imagem;
- JavaScript mínimo para o `click-to-load` substitui a preferência anterior por zero JavaScript;
- em larguras de até 480 px, o link externo substitui o iframe incorporado.

## 3. Público, proposta e conversão

### Público prioritário

Profissionais e lideranças de software interessados em engenharia com IA, processos de qualidade e aprendizagem aplicada.

### Público secundário

Estudantes, pessoas desenvolvedoras em formação e comunidade técnica interessada em materiais, artigos e encontros.

### Relação entre as marcas

- Emerson é a pessoa e marca principal da página.
- Fazedor de Código é a frente editorial, newsletter e comunidade.
- Cursor e Devin aparecem apenas nos títulos autodeclarados de Ambassador.
- Nenhuma marca externa assume o protagonismo visual da página.

### Conversões

1. **Principal:** `Assinar o Fazedor de Código`, com salto para `#newsletter`.
2. **Secundária única:** `Vamos conversar`, apontando diretamente para `https://www.linkedin.com/in/fazedordecodigo/`.

GitHub e Substack aparecem como perfis públicos no rodapé. E-mail e localização não aparecem.

## 4. Escopo da versão 1

### Incluído

- página única, estática e responsiva;
- hero com retrato, posicionamento, títulos de Ambassador e dois CTAs;
- quatro provas profissionais selecionadas;
- perfil curto, sem cronologia curricular;
- três artigos recentes materializados no HTML durante o build;
- assinatura do Substack com `click-to-load` acima de 480 px e link externo sempre visível;
- rodapé com LinkedIn, GitHub e Substack;
- metadados SEO e sociais;
- build determinístico, testes e deploy pelo Azure Static Web Apps;
- remoção do Bootstrap, jQuery, plugins, AllOrigins, Icomoon e fontes de estilo duplicadas.

### Fora de escopo

- páginas internas de artigo, blog ou currículo;
- CMS, aplicação cliente, framework SPA/SSR ou API própria;
- carrossel, timeline, formulário de contato ou e-mail público;
- capas de artigos, logos ou selos de Cursor/Devin;
- empregador atual, `15+ anos`, FIAP, TRAE Fellow e métricas voláteis;
- datas, responsabilidades ou natureza do vínculo de Ambassador;
- JSON-LD na versão 1;
- analytics, pixels ou personalização;
- automação que faça commit no repositório;
- declaração integral de WCAG 2.2 AA para o conteúdo interno do iframe;
- declaração jurídica de consentimento/LGPD/GDPR;
- implementação ou deploy durante o charting atual.

## 5. Arquitetura de informação e copy

### 5.1 Ordem da página

1. skip link;
2. cabeçalho com marca pessoal e navegação;
3. hero;
4. provas profissionais;
5. perfil;
6. artigos;
7. newsletter;
8. rodapé/contato.

Não há menu oculto que torne a navegação indisponível. A ordem visual, de leitura e de foco permanece equivalente.

### 5.2 Navegação

| Rótulo | Destino |
|---|---|
| Início | `#inicio` |
| Perfil | `#perfil` |
| Artigos | `#artigos` |
| Newsletter | `#newsletter` |
| Contato | `#contato` |

### 5.3 Hero aprovado

- Eyebrow: `Engenharia de software · IA · Educação`
- Destaques: `Cursor Ambassador` e `Devin Ambassador`
- H1: `Construo software. Ensino o processo. Compartilho o que funciona.`
- Lead: `Atuo na interseção entre engenharia de software e inteligência artificial. No Fazedor de Código, transformo prática em software aberto, materiais de ensino, artigos e encontros para quem quer construir com mais clareza, qualidade e segurança.`
- CTA principal: `Assinar o Fazedor de Código`
- CTA secundário: `Vamos conversar`
- Alt do retrato: `Retrato de Emerson Delatorre`
- Legenda: `Emerson Delatorre`

Os títulos de Ambassador são texto. Não usam logos, selos, datas ou explicações de vínculo.

### 5.4 Provas aprovadas

| Título | Legenda |
|---|---|
| Engenharia + IA | Software, agentes e qualidade |
| PyFlunt | Open source em Python |
| Ensino prático | Materiais, workshops e palestras |
| Fazedor de Código | Newsletter, artigos e comunidade |

### 5.5 Perfil

- Eyebrow: `01 · Perfil`
- H2: `Engenharia, ensino e IA na mesma trajetória`
- Introdução: `Projetos públicos, materiais didáticos, artigos e encontros formam o mesmo ciclo: construir, testar, explicar e melhorar com a comunidade.`
- Card 1 kicker: `Como eu trabalho`
- Card 1 título: `Prática primeiro, clareza sempre`
- Card 1 texto: `O ponto de partida é o software real. A partir dele, organizo processos, compartilho decisões e transformo aprendizado em material que outras pessoas conseguem usar.`
- Temas: `Agentes de IA`, `Arquitetura`, `Qualidade`, `Open source`
- Card 2 kicker: `Frente editorial`
- Card 2 título: `Fazedor de Código`
- Card 2 texto: `A página é de Emerson. O Fazedor de Código reúne newsletter, artigos e comunidade — e concentra a assinatura principal sem competir com a marca pessoal.`

### 5.6 Artigos

- Eyebrow: `02 · Artigos`
- H2: `Ideias recentes, direto do Substack`
- Introdução: `Três publicações recentes do Fazedor de Código, atualizadas a partir do feed oficial do Substack.`
- Link permanente: `Ver todos os artigos no Substack`
- Link de cada card: `Ler no Substack →`

Os títulos, resumos, datas, séries e URLs dos cards vêm do snapshot sanitizado. Nenhum texto sobre protótipo, simulação ou capa aparece na produção.

### 5.7 Newsletter

- Eyebrow: `Fazedor de Código`
- H2: `Receba o que vale a pena ler`
- Introdução: `Carregue o formulário somente se quiser interagir com o Substack. A moldura pertence a esta página; o conteúdo interno, a coleta e os estados do formulário pertencem ao terceiro.`
- Kicker: `Substack · click-to-load`
- Estado inicial: `O terceiro ainda não foi solicitado`
- Explicação: `Ao continuar, o navegador solicitará o formulário ao Substack, que pode carregar cookies, telemetria e outros recursos de terceiros. Nenhuma inscrição é enviada automaticamente.`
- Botão: `Carregar formulário do Substack`
- Link permanente: `Assinar no Substack`
- Mensagem até 480 px: `Formulário não oferecido nesta largura. Use o link Assinar no Substack.`

O texto explica a transferência ao terceiro; ele não chama o clique de consentimento jurídico.

### 5.8 Rodapé

- Kicker: `Contato`
- H2: `Vamos construir algo que valha a pena compartilhar?`
- Links: LinkedIn, GitHub e Substack
- Assinatura: `Code. Compartilhe. Construa. Impacte.`

Destinos canônicos:

| Destino | URL |
|---|---|
| LinkedIn | `https://www.linkedin.com/in/fazedordecodigo/` |
| GitHub | `https://github.com/fazedordecodigo` |
| Substack | `https://fazedordecodigo.substack.com/` |
| Feed | `https://fazedordecodigo.substack.com/feed` |
| Embed | `https://fazedordecodigo.substack.com/embed` |

## 6. Direção visual aprovada

### Tokens

| Papel | Valor |
|---|---|
| Fundo | `#F7F7F5` |
| Tinta | `#111111` |
| Laranja único | `#FF6A00` |
| Superfície | `#FFFFFF` |
| Bege | `#E9D8C3` |
| Marrom/alerta | `#8B5E3C` |
| Texto secundário | `#6E6C67` |
| Borda | `#DCD9D3` |

Regras:

- laranja é sinal raro, não lavagem de fundo;
- texto sobre laranja usa `#111111`, nunca branco;
- H1 e todos os H2 visíveis usam Space Grotesk 700 e caixa alta; H3 preserva a capitalização editorial;
- corpo usa Inter 400/600;
- eyebrows e dados usam JetBrains Mono 500/700;
- fontes são WOFF2 locais, com `font-display: swap`, apenas nos pesos usados e com licenças preservadas;
- grade base de 8 px, container central com máximo de 1160 px;
- raios 8, 16 e 24 px e pílula;
- bordas finas e divisórias tracejadas; sem gradientes ou sombras pesadas;
- controles não inline têm pelo menos 44 × 44 CSS px;
- foco visível usa anel escuro de 2 px e offset de 2 px;
- `prefers-reduced-motion: reduce` elimina movimento não essencial.

O contrato visual completo e independente do artefato descartável está na [referência aprovada](../reference/2026-08-15-personal-site-design-reference.md). O banner `PROTÓTIPO`, o seletor de estados, atalhos por setas e `?state=` não entram na produção.

## 7. Retrato e imagens

O arquivo-fonte aprovado é `/home/madruga/Imagens/eu.jpg`, JPEG 400 × 400, 21.790 bytes, SHA-256 `63fb6bdb780c1c3f44fa9e4b2f62dea91f0795427fed85c9b65d3c93eba62ecd`.

Na implementação ele será copiado sem alteração para `src/assets/images/emerson-delatorre.jpg` e usado:

- no hero, com `width="400"`, `height="400"`, `fetchpriority="high"`, sem lazy-load, e CSS responsivo sem ampliar acima de 400 px;
- em `og:image` e `twitter:image`, por ser a única imagem editorial aprovada.

Não serão criadas capas, logos ou uma composição social não aprovada. Os cards de artigos são estritamente textuais e o campo `enclosure` do RSS é ignorado.

## 8. Arquitetura técnica

### 8.1 Princípio

O navegador recebe HTML já materializado. RSS, XML, ordenação, deduplicação e fallback pertencem ao build.

```text
feed remoto ou snapshot versionado
        ↓
loadArticles()
        ↓
FeedResult validado
        ↓
renderSite()
        ↓
public/ permitido por manifesto
        ↓
gates
        ↓
Azure Static Web Apps
```

### 8.2 Layout futuro do repositório

```text
src/
  index.template.html
  css/site.css
  js/substack-embed.js
  assets/
    images/emerson-delatorre.jpg
    fonts/space-grotesk-latin-700-normal.woff2
    fonts/inter-latin-400-normal.woff2
    fonts/inter-latin-600-normal.woff2
    fonts/jetbrains-mono-latin-500-normal.woff2
    fonts/jetbrains-mono-latin-700-normal.woff2
    fonts/LICENSES.md
    fonts/OFL-1.1.txt
  robots.txt
  sitemap.xml
content/
  articles.snapshot.json
scripts/
  articles/constants.mjs
  articles/parse-feed.mjs
  articles/load-articles.mjs
  articles/snapshot.mjs
  build-site.mjs
  render-site.mjs
  static-assets.mjs
  copy-static-assets.mjs
  serve.mjs
  check-artifact.mjs
  run-lighthouse.mjs
tests/
  fixtures/*.xml
  unit/*.test.mjs
  contracts/*.test.mjs
  browser/*.spec.mjs
package.json
package-lock.json
.nvmrc
.java-version
eslint.config.mjs
stylelint.config.mjs
playwright.config.mjs
lighthouserc.cjs
staticwebapp.config.json
.github/workflows/site.yml
public/                         # gerado, ignorado pelo Git
```

### 8.3 Artefato público permitido

Depois de recriar `public/` do zero, somente estes caminhos podem existir:

```text
public/index.html
public/robots.txt
public/sitemap.xml
public/staticwebapp.config.json
public/css/site.css
public/js/substack-embed.js
public/assets/images/emerson-delatorre.jpg
public/assets/fonts/LICENSES.md
public/assets/fonts/OFL-1.1.txt
public/assets/fonts/space-grotesk-latin-700-normal.woff2
public/assets/fonts/inter-latin-400-normal.woff2
public/assets/fonts/inter-latin-600-normal.woff2
public/assets/fonts/jetbrains-mono-latin-500-normal.woff2
public/assets/fonts/jetbrains-mono-latin-700-normal.woff2
```

O checker falha para qualquer arquivo inesperado, source map, demo, fonte não usada ou asset legado.

### 8.4 Runtime

- um `public/index.html`;
- um CSS autoral externo;
- um JavaScript local, `defer`, dedicado somente ao iframe;
- nenhum script ou stylesheet remoto;
- nenhum fetch de RSS ou proxy no navegador;
- nenhum jQuery, Bootstrap, Icomoon, carrossel, parallax ou biblioteca de animação;
- nenhum `style`, handler ou script inline;
- nenhuma rota editorial; URL desconhecida retorna 404.

## 9. Contrato do feed e do snapshot

### 9.1 Tipos

```js
Article = {
  id: string,          // guid normalizado e único
  title: string,       // 1..160 pontos de código
  excerpt: string,     // 1..240 pontos de código
  publishedAt: string, // instante ISO-8601 válido
  url: string,         // URL canônica de post permitida
  eyebrow: string      // Cursor Weekly | Devin Weekly | Fazedor de Código
}

ArticleSnapshot = {
  schemaVersion: 1,
  sourceUrl: "https://fazedordecodigo.substack.com/feed",
  fetchedAt: string,   // instante ISO-8601 válido
  timeZone: "America/Sao_Paulo",
  articles: Article[3]
}

ParseFeedResult = {
  articles: Article[3],
  diagnostics: {
    totalItems: number,
    acceptedBeforeLimit: number,
    discardedByCode: {
      FIELD_INVALID: number,
      URL_FORBIDDEN: number,
      DATE_INVALID: number,
      DUPLICATE_CONFLICT: number,
      DUPLICATE_IDENTICAL: number
    }
  }
}

FeedResult = {
  state: "fresh" | "stale",
  source: "remote" | "snapshot",
  fetchedAt: string,
  articles: Article[3],
  warningCode: null | "SNAPSHOT_STALE"
}

BuildReport =
  | {
      status: "built",
      articleMode: "snapshot" | "remote-required",
      state: "fresh" | "stale",
      articleSource: "remote" | "snapshot",
      articleCount: 3,
      snapshotFetchedAt: string,
      outputFiles: string[],
      fallbackReasonCode: null | "SNAPSHOT_STALE"
    }
  | {
      status: "blocked",
      articleMode: "snapshot" | "remote-required",
      state: "refresh-error" | "empty",
      articleSource: "remote" | "snapshot",
      articleCount: 0,
      snapshotFetchedAt: null,
      outputFiles: [],
      fallbackReasonCode:
        | "TIMEOUT"
        | "NETWORK"
        | "HTTP_STATUS"
        | "CONTENT_TYPE"
        | "BODY_TOO_LARGE"
        | "REDIRECT_FORBIDDEN"
        | "REMOTE_CONTRACT"
        | "SNAPSHOT_INVALID"
    }
```

### 9.2 Normalização

1. Ler apenas `title`, `description`, `link`, `guid` e `pubDate` de cada `item`.
2. Nunca ler nem persistir `content:encoded`, autor, e-mail, copyright ou `enclosure`.
3. Rejeitar DTD, declaração de entidade e entidade externa antes de parsear.
4. O parser XML não resolve entidades externas.
5. Converter `description` de fragmento HTML para texto, decodificar entidades uma vez, normalizar em NFC, aparar e colapsar espaços.
6. Normalizar `title` em NFC, aparar e colapsar espaços.
7. Truncar por ponto de código, sem dividir par substituto: título em 160 e resumo em 240.
8. Validar `pubDate` como instante e serializar em UTC ISO-8601.
9. Validar `link`: protocolo `https:`, host exato `fazedordecodigo.substack.com`, sem credenciais ou porta, caminho iniciado por `/p/`; remover query e fragmento.
10. Derivar `id` do `guid` aplicando Unicode NFC e removendo apenas whitespace das extremidades; whitespace interno é preservado e não é colapsado. Exigir resultado não vazio e limitado a 2.048 pontos de código. Itens individualmente inválidos são descartados com contadores por código, nunca com conteúdo bruto em log.
11. Agrupar pelo `id` resultante: cópias normalizadas idênticas viram um item; se o mesmo `id` trouxer conteúdo conflitante, todo o grupo é descartado e contado como `DUPLICATE_CONFLICT`.
12. Ordenar os itens restantes por `publishedAt` decrescente e, em empate, pelo `id` normalizado crescente em ordem lexicográfica de pontos de código.
13. Selecionar exatamente os três primeiros artigos válidos; menos de três após validação e deduplicação interrompe o build com `ITEMS_INSUFFICIENT`.
14. Derivar `eyebrow` pelo início do título, sem diferenciar maiúsculas: `Cursor Weekly`, `Devin Weekly` ou `Fazedor de Código`.
15. Obter as partes de data/hora com `Intl.DateTimeFormat(...).formatToParts()` e `timeZone: "America/Sao_Paulo"`, preservando o instante ISO no atributo `datetime`. A data do card usa literalmente `D mmm. YYYY`, com meses `jan.`, `fev.`, `mar.`, `abr.`, `mai.`, `jun.`, `jul.`, `ago.`, `set.`, `out.`, `nov.`, `dez.`. A captura usa `Última atualização: DD/MM/YYYY às HH:mm (America/Sao_Paulo).`.

### 9.3 Política HTTP

- URL inicial constante: `https://fazedordecodigo.substack.com/feed`;
- somente HTTPS e host exato, revalidados em cada redirect;
- no máximo três redirects;
- status final exatamente 200;
- `Content-Type` permitido: `application/xml` ou `text/xml`, com parâmetros opcionais;
- limite de 1 MiB no corpo descomprimido, conferido durante o streaming e pelo header quando presente;
- timeout de 8 segundos por tentativa;
- uma repetição após 500 ms somente para erro de rede, timeout, 429 ou 5xx;
- máximo total de duas tentativas;
- erro de tipo, tamanho, redirect, XML ou contrato não é repetido.

### 9.4 Modos de build e persistência

| Modo | Uso | Rede | Resultado |
|---|---|---|---|
| `snapshot` | local e pull request | proibida | valida `content/articles.snapshot.json` e gera preview determinístico |
| `remote-required` | push em `main`, agenda e disparo manual | feed oficial apenas | sucesso gera artefato fresco; qualquer falha bloqueia o deploy |

`content/articles.snapshot.json` é o baseline versionado para testes e PRs. Ele só muda por `npm run snapshot:refresh`, executado e revisado por uma pessoa; nenhum workflow faz commit automático.

A persistência operacional do último snapshot válido é o **último deploy bem-sucedido no Azure**. Se o build remoto falhar, o job termina antes da ação de deploy e o site anterior permanece intacto. Assim, um runner efêmero nunca substitui conteúdo válido por vazio nem regride o site com um snapshot local mais antigo.

O build sempre grava um `BuildReport` sanitizado: no sucesso antes de retornar zero; no bloqueio antes de retornar código diferente de zero. O relatório informa modo, estado, origem, quantidade, `fetchedAt`, motivo de bloqueio e manifesto do artefato, sem XML bruto.

### 9.5 Idade

Um snapshot tem estado `stale` quando `now - fetchedAt > 48 horas`. O preview mostra a captura no formato fixo acima e, quando stale, a mensagem literal `Conteúdo preservado; a última atualização tem mais de 48 horas.` em marrom. A idade nunca é calculada a partir de `lastBuildDate` nem da data do artigo.

## 10. Estados e fallbacks

| Estado do protótipo | Superfície real | Publicável | Comportamento |
|---|---|---|---|
| `normal` | produção e preview | sim | três cards e data da captura |
| `stale` | preview por snapshot | não no fluxo normal de deploy | três cards preservados, data e aviso de defasagem |
| `refresh-error` | `BuildReport` e teste unitário | não | build remoto falha; Azure mantém o deploy anterior; nenhum HTML novo é renderizado |
| `empty` | `BuildReport` e teste unitário | não | snapshot ausente/inválido faz o build retornar código diferente de zero; nenhum HTML novo é renderizado |
| `image-fallback` | somente protótipo aprovado | não existe na implementação | removido porque cards v1 não têm imagem |

Regras invariantes:

- nunca inventar artigos;
- nunca publicar zero, um ou dois cards;
- sempre exibir o link `Ver todos os artigos no Substack` quando a seção existe;
- o browser nunca possui estado de loading do feed;
- conteúdo remoto é escapado por contexto antes de entrar no HTML;
- dados do feed nunca são entregues a `innerHTML`, `outerHTML`, `insertAdjacentHTML` ou `document.write` no browser.

## 11. Contrato do embed Substack

### 11.1 Estado inicial

- não há atributo `src` no iframe;
- não há `preconnect`, preload ou request ao Substack;
- contexto, botão e link externo já estão visíveis;
- o iframe tem `data-src="https://fazedordecodigo.substack.com/embed"`, `data-timeout-ms="12000"`, `title="Inscrição na newsletter Fazedor de Código"`, `width="480"`, `height="320"`, `loading="lazy"` e `referrerpolicy="strict-origin-when-cross-origin"`;
- o wrapper reserva pelo menos 320 px de altura somente depois da ativação.

### 11.2 Ativação acima de 480 px

1. clique ou ativação por teclado no botão verifica `min-width: 481px`;
2. o botão não aceita uma segunda ativação;
3. o painel recebe `aria-busy="true"` e uma região `role="status"` anuncia a solicitação;
4. o script atribui a URL exata a `src` uma única vez;
5. o foco vai para o status, não para o `body`;
6. em `load`, `aria-busy` volta a `false` e o texto informa apenas que a navegação terminou, não que o formulário ou a inscrição funcionaram;
7. após 12 segundos sem `load`, o timer é encerrado, `aria-busy` volta a `false`, o status informa que não foi possível confirmar o carregamento e o link externo recebe destaque visual;
8. o link `Assinar no Substack` permanece visível em todos os estados.

Não se tenta ler, alterar ou estilizar o documento cross-origin. `sandbox` não é aplicado na v1 porque o fluxo real ainda não foi validado com as permissões necessárias; esta omissão é um risco documentado, não uma alegação de segurança do terceiro.

Strings de estado obrigatórias:

- loading: `Solicitação enviada ao Substack. Se a área abaixo não funcionar, use Assinar no Substack.`
- load: `O navegador concluiu a navegação do iframe, mas esta página não consegue confirmar o conteúdo interno nem a inscrição.`
- timeout: `Não foi possível confirmar o carregamento do formulário. Use Assinar no Substack.`

### 11.3 Até 480 px

- botão, facade e iframe não são oferecidos;
- nenhum request de iframe ocorre;
- aparece a mensagem curta de largura;
- `Assinar no Substack` é a única forma de inscrição;
- o breakpoint é testado separadamente em 480 e 481 px.

A regra é avaliada ao carregar e imediatamente antes da ativação. Um iframe já solicitado após ação explícita não é descarregado automaticamente em um resize; a validação de lançamento confirma que essa transição não cria perda de foco ou overflow.

## 12. HTML, acessibilidade e responsividade

O alvo para o conteúdo controlado é WCAG 2.2 nível AA. Automação é gate parcial, não declaração de conformidade.

| ID | Critério verificável |
|---|---|
| HTML-01 | Existe exatamente um HTML público, `public/index.html`; caminhos desconhecidos retornam 404. |
| HTML-02 | Nu HTML Checker retorna zero erros. |
| HTML-03 | Há skip link, `header`, `nav` nomeada, `main`, seções tituladas e `footer`. |
| HTML-04 | Há exatamente um H1 e a hierarquia H2/H3 é lógica. |
| HTML-05 | Não há IDs duplicados, links vazios, atributos `style`, scripts ou handlers inline. |
| HTML-06 | O único `img` de conteúdo tem alt editorial e dimensões; decoração fica fora da árvore acessível. |
| HTML-07 | Conteúdo e navegação continuam úteis sem CSS, sem JS e com iframe bloqueado. |
| HTML-08 | Não há classes ou markup de Bootstrap, Icomoon, Stellar, Animate ou carrossel. |
| A11Y-01 | `html[lang="pt-BR"]`; títulos oficiais em inglês usam `lang="en"` quando isolados. |
| A11Y-02 | Tab, Shift+Tab, Enter e Espaço operam tudo sem armadilha; entrada/saída do iframe é testada quando carregado. |
| A11Y-03 | Ordem de foco: skip; links da navegação; CTAs do hero; links dos artigos; botão Substack em ≥481 px; iframe após ativação; fallback externo; links do rodapé. Em ≤480 px, botão e iframe são omitidos. |
| A11Y-04 | Todo foco é visível, não encoberto e tem contraste de pelo menos 3:1. |
| A11Y-05 | Texto normal atinge 4,5:1; texto grande 3:1; controles essenciais 3:1. |
| A11Y-06 | Nenhum texto branco normal usa o laranja aprovado. |
| A11Y-07 | Em 320 px e reflow equivalente a 160 CSS px não há perda, sobreposição ou scroll horizontal da página. |
| A11Y-08 | Controles não inline medem pelo menos 44 × 44 CSS px. |
| A11Y-09 | Reduced motion remove transforms, transições e smooth scroll não essenciais. |
| A11Y-10 | Links e controles têm nome acessível que identifica destino/finalidade. |
| A11Y-11 | Loading/timeout do iframe são anunciados; foco não cai no `body`. |
| A11Y-12 | Axe tem zero violações críticas/sérias e Lighthouse Accessibility é 1,00. |
| A11Y-13 | Revisão humana de teclado, zoom e leitura é registrada antes do lançamento. |

Viewports automáticos obrigatórios: 320, 480, 481, 768 e 1440 px. O reflow equivalente a 160 CSS px é testado em browser. Em 768 px, hero, perfil, artigos e newsletter usam uma coluna; as provas podem usar duas. Em 320 px, tudo que precisar cai para uma coluna.

Não se declara conformidade integral da página enquanto o iframe do Substack mantiver defeitos internos. Uma eventual declaração pública deve ser parcial e identificar o conteúdo de terceiro.

## 13. Segurança e privacidade

| ID | Critério verificável |
|---|---|
| SEC-01 | Antes do clique, nenhum request vai a Substack, RSS, AllOrigins, SociableKit ou Google Fonts. |
| SEC-02 | Output não contém jQuery, Bootstrap, plugins, Icomoon ou script remoto. |
| SEC-03 | Feed usa URL constante, limites HTTP, parser sem DTD/XXE, allowlist e escaping contextual. |
| SEC-04 | Falha remota impede novo deploy; ausência/invalidade do snapshot impede build de PR. |
| SEC-05 | CSP bloqueante não contém wildcard, `unsafe-inline`, `unsafe-eval` ou origem não aprovada. |
| SEC-06 | Iframe usa HTTPS e host exato; há no máximo um frame de terceiro. |
| SEC-07 | Actions externas usam SHA completo e permissões mínimas. |
| SEC-08 | Código de PR não recebe segredo e não há `pull_request_target`. |
| SEC-09 | Logs, artifacts e snapshots não contêm XML bruto, e-mail do feed ou payload do formulário. |
| SEC-10 | Scan confirma ausência de sinks HTML no JS de runtime e de origens banidas no artefato. |

Headers obrigatórios em `staticwebapp.config.json`:

```text
Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src https://fazedordecodigo.substack.com; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()
```

O CSP entra bloqueante no artefato. Antes da produção, o mesmo artefato é validado em preview Azure por console, headers e Network. O iframe pode carregar recursos internos próprios depois do clique; isso não amplia `connect-src` do documento pai.

## 14. Desempenho

| ID | Orçamento/gate |
|---|---|
| PERF-01 | Exatamente um CSS; tamanho gzip até 20 KiB. |
| PERF-02 | Exatamente um JS próprio, local e `defer`; tamanho gzip até 5 KiB. |
| PERF-03 | Carga inicial antes do iframe até 350 KiB transferidos. |
| PERF-04 | Retrato no HTML, sem lazy-load, com dimensões, responsivo e sem ampliação acima de 400 px. |
| PERF-05 | Somente fontes WOFF2 locais e pesos usados; `font-display: swap`. |
| PERF-06 | Lighthouse CI executa três vezes: Performance ≥0,90; Accessibility =1,00; Best Practices ≥0,95; SEO =1,00. |
| PERF-07 | Mediana de laboratório: LCP ≤2.500 ms, CLS ≤0,1 e TBT ≤200 ms. |
| PERF-08 | Métricas pré-clique e pós-clique do iframe são registradas separadamente. |
| PERF-09 | Após amostra de produção: p75 LCP ≤2,5 s, INP ≤200 ms e CLS ≤0,1 em mobile e desktop. |

PERF-09 é gate operacional posterior, não bloqueia merge da primeira implementação.

## 15. SEO e compartilhamento

Valores aprovados em Q13:

```text
title: Emerson Delatorre — Engenharia de Software, IA e Educação
description: Engenharia de software, inteligência artificial e ensino prático. Conheça projetos, artigos e o Fazedor de Código.
canonical: https://delatorre.dev/
og:type: website
og:locale: pt_BR
og:site_name: Emerson Delatorre
og:title: Emerson Delatorre — Engenharia de Software, IA e Educação
og:description: Engenharia de software, inteligência artificial e ensino prático. Conheça projetos, artigos e o Fazedor de Código.
og:url: https://delatorre.dev/
og:image: https://delatorre.dev/assets/images/emerson-delatorre.jpg
og:image:width: 400
og:image:height: 400
og:image:alt: Retrato de Emerson Delatorre
twitter:card: summary
twitter:title: Emerson Delatorre — Engenharia de Software, IA e Educação
twitter:description: Engenharia de software, inteligência artificial e ensino prático. Conheça projetos, artigos e o Fazedor de Código.
twitter:image: https://delatorre.dev/assets/images/emerson-delatorre.jpg
twitter:image:alt: Retrato de Emerson Delatorre
```

`robots.txt` permite `/` e referencia `https://delatorre.dev/sitemap.xml`. O sitemap contém somente `https://delatorre.dev/`. Não existem `meta keywords`, `noindex` ou JSON-LD.

Gates:

- metadata obrigatória está no `head`, não vazia e coerente;
- os três artigos estão no HTML inicial com links rastreáveis;
- no preview nomeado, a rota equivalente `/assets/images/emerson-delatorre.jpg` responde 200 com `image/jpeg`, enquanto `og:image` e `twitter:image` preservam os URLs absolutos canônicos acima;
- Lighthouse SEO = 1,00.

O domínio final ainda serve o legado antes do primeiro deploy e, portanto, não pode provar o novo asset nem os novos headers antecipadamente. Após um deploy de produção autorizado separadamente, um gate operacional imediato verifica `og:image`/`twitter:image` no domínio final, convergência de HTTP/hostname Azure/`www`, headers, CSP e o social preview. Falha nesse gate aciona rollback; nenhum desses itens pode ser declarado validado com evidência apenas do preview.

## 16. CI, deploy e validação

### 16.1 Workflow único

`.github/workflows/site.yml` responde a:

- `pull_request` para `main`;
- `push` em `main`;
- `workflow_dispatch`, com escolha obrigatória `deployment_target` entre `build-only` (default), `preview` e `production`;
- agenda `17 12 * * *` — 12:17 UTC, aproximadamente 09:17 em America/Sao_Paulo na data desta especificação.

O job `validate-and-build`:

- usa Node 22.23.2 e `npm ci`;
- em PR usa modo `snapshot`; nos demais eventos usa `remote-required`;
- não recebe segredo de Azure;
- executa testes unitários, contratos, ESLint, Stylelint, Nu, Playwright, axe e Lighthouse;
- recria `public/`, verifica o manifesto e publica um único artifact imutável;
- falha antes do upload se o feed remoto falhar em evento de deploy;
- em um passo posterior com `if: always()`, anexa ao step summary o `BuildReport` sanitizado quando o arquivo existir e passar a validação de schema/tamanho; uma falha anterior ao build é registrada como relatório indisponível, sem fabricar estado;
- condiciona manifesto e upload de `public/` ao sucesso do aggregate, de modo que um `refresh-error` permaneça observável sem liberar artefato.

Os jobs `deploy-preview` e `deploy-production`:

- depende de `validate-and-build`;
- não roda em PR;
- baixa exatamente o artifact produzido pelo job anterior;
- são os únicos jobs que leem o segredo já existente `AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SMOKE_089E11B1E`;
- usa `skip_app_build: true`, `app_location: /public` e `output_location: ""`;
- não faz checkout nem reconstrói o site;
- nunca roda quando qualquer gate falha.

`deploy-preview` só roda em `workflow_dispatch` sobre `main`, com `deployment_target=preview`, `vars.PREVIEW_DEPLOY_ENABLED == 'true'` e environment protegido `preview`. A ação recebe `deployment_environment: qa`, criando o [ambiente nomeado de preview](https://learn.microsoft.com/azure/static-web-apps/named-environments), e registra seu output `static_web_app_url`. Não usa domínio customizado.

`deploy-production` só roda sobre `main`, com `vars.PRODUCTION_DEPLOY_ENABLED == 'true'`, e atende `push`, agenda ou `workflow_dispatch` com `deployment_target=production`. Usa o environment protegido `production` e não define `deployment_environment`.

As duas variáveis ausentes equivalem a `false`. Criar/configurar os environments, habilitar uma variável ou executar o primeiro deploy exige autorização humana específica; a implementação por si só não ativa preview nem produção. O nome do segredo legado é preservado; qualquer rotação ou renomeação é uma operação humana separada.

O caminho de preview é explícito: após verificação local e autorização de merge, a implementação entra em `main` com ambas as flags falsas; esse push apenas constrói e valida. Uma autorização posterior cria/configura o environment `preview`, habilita temporariamente `PREVIEW_DEPLOY_ENABLED` e dispara manualmente `deployment_target=preview`. Produção continua bloqueada.

O workflow usa permissões explícitas e pin de actions por SHA completo: validação tem `contents: read`; cada deploy acrescenta somente `actions: read` para consultar execuções do próprio workflow. PRs usam um grupo de concorrência por número e podem cancelar sua execução anterior. Eventos confiáveis usam um grupo externo compartilhado sem cancelar o job em execução; execuções pendentes intermediárias podem ser substituídas pelo GitHub e não são tratadas como fila garantida. O `run-name` identifica `build-only`, `preview` ou `production`. Imediatamente antes do Azure, uma guarda confirma que `github.sha` ainda é a ponta de `refs/heads/main` e que `github.run_id` é a execução mais recente da mesma lane; uma execução obsoleta termina sem publicar. Dependências npm são exatas no `package-lock.json` e instaladas apenas com `npm ci` na CI.

### 16.2 Comandos canônicos

```bash
npm ci
npm run browsers:install
java -version
npm test
npm run lint
npm run build:snapshot
npm run validate:html
npm run check:artifact
npm run test:browser
npm run test:a11y
npm run lighthouse
npm run verify
npm run verify:remote
```

O toolchain suportado usa Node 22.23.2, Java 21 para o Nu HTML Checker e os binários Chromium/Firefox da versão Playwright bloqueada no lockfile. `npm test` executa os testes unitários. `npm run verify` é alias de `verify:snapshot`: executa lint e unitários, faz exatamente um build por snapshot e então valida esse mesmo artifact com contratos, Nu, manifesto, browsers, axe e Lighthouse. `verify:remote` troca apenas o build por `remote-required` e aplica todos os mesmos gates ao artifact remoto; não entra em PR.

### 16.3 Camadas de validação

| Camada | Prova | Pode afirmar |
|---|---|---|
| Estrutural | unitários, contratos, lint, Nu, manifesto, budgets | artefato estático e contratos locais válidos |
| Visual | screenshots e inspeção em 320/480/481/768/1440 e reflow 160 | fidelidade à referência visual durável e ausência de defeitos observados |
| Integrada em preview | headers reais, CSP, requests, iframe bloqueado/carregado, canonical e 404 | integração técnica no Azure preview |
| Humana de lançamento | teclado, zoom 200%, Chrome/Firefox, NVDA/Firefox ou Safari/VoiceOver, submit autorizado | prontidão para publicação dentro dos limites registrados |
| Operacional | produção, redirects, social cards e Core Web Vitals de campo | saúde após lançamento |

### 16.4 Gates humano e operacional de lançamento

Antes de autorizar a primeira publicação em produção, uma pessoa deve registrar no preview:

- comparação visual com a referência durável aprovada;
- percurso completo de teclado e foco, inclusive iframe;
- zoom/reflow e reduced motion;
- Chrome e Firefox desktop; um navegador móvel real;
- NVDA com Firefox ou VoiceOver com Safari;
- iframe bloqueado, carregamento, timeout e link externo;
- submit com endereço de teste autorizado, incluindo sucesso/erro/double opt-in;
- cookies/requests após clique e limite de conformidade parcial;
- headers e CSP no hostname Azure do preview;
- metadata canonical absoluta, `robots.txt`, sitemap e disponibilidade do asset social equivalente no preview;
- Lighthouse final e budgets pré/pós-clique.

Depois de um deploy de produção autorizado separadamente, uma verificação operacional imediata deve registrar no domínio final: resposta 200/JPEG do asset social; headers e CSP; redirects de HTTP, `www` e hostname Azure; canonical, `robots.txt` e sitemap; depurador social; e um smoke Lighthouse. Qualquer falha bloqueadora exige rollback para o deploy anterior. Essa verificação pós-deploy não integra o preview nem é autorizada por este documento ou pelo aceite Q13.

Sem a evidência pré-deploy, a entrega pode ser chamada de implementada ou pronta para preview, mas não de pronta para produção. Sem a verificação operacional pós-deploy, o lançamento não pode ser chamado de concluído. Em nenhum dos dois casos se declara WCAG 2.2 AA integral por causa dos limites do iframe de terceiro.

## 17. Migração do legado

A migração usa cortes verticais:

1. criar tooling, testes, template novo e output `public/` sem alterar o site servido;
2. implementar feed, renderer, CSS, retrato e iframe dentro do novo pipeline;
3. provar o artifact completo e sem referências legadas;
4. remover o legado em um commit separado;
5. trocar o workflow Azure somente depois de todos os gates locais passarem.

Remoção final inclui Bootstrap, jQuery, plugins, AllOrigins, SociableKit, Google Fonts, Icomoon, Sass, maps, demos e o workflow Azure antigo. A lista exata e a ordem estão no [plano de implementação](../superpowers/plans/2026-08-15-personal-site-implementation.md).

## 18. Riscos residuais e decisões explícitas

| Risco | Tratamento |
|---|---|
| Títulos de Ambassador não têm validação institucional pública | autodeclaração aprovada pelo titular; não inferir detalhes nem usar logos |
| Retrato tem apenas 400 × 400 | não ampliar acima de 400 px; medir LCP real; solicitar novo asset somente se o layout futuro exigir |
| Feed ou Substack indisponível | build remoto falha antes do deploy; site anterior permanece no Azure |
| Runner não persiste arquivos entre execuções | persistência é o deploy anterior; snapshot do repositório só muda por revisão humana |
| Iframe possui defeitos internos e trackers | click-to-load, explicação, link externo e declaração de conformidade parcial |
| `load` do iframe não prova formulário funcional | copy e testes nunca tratam `load` como submit/sucesso |
| `sandbox` não validado | omitido na v1 e reavaliado no gate integrado |
| CSP/headers Azure ainda não executados | gate obrigatório de preview; nenhuma alegação antecipada |
| Safari, browser móvel e tecnologia assistiva não automatizados | gate humano de lançamento |
| Core Web Vitals de campo inexistentes antes da produção | acompanhar somente após amostra suficiente |
| Horário agendado é UTC | documentação registra a equivalência aproximada; mudança de fuso requer revisão operacional |

## 19. Critério de aceite da implementação

A implementação futura estará concluída quando:

1. toda copy, estrutura, destino e omissão desta especificação estiverem no artifact;
2. o artifact contiver somente os caminhos permitidos;
3. os contratos do feed e do iframe tiverem testes de sucesso e falha;
4. todos os IDs HTML, A11Y, SEC e PERF aplicáveis ao PR passarem;
5. metadata, indexabilidade e artigos no HTML inicial passarem;
6. o legado estiver ausente do source servido, output e workflow;
7. com Node 22.23.2 e Java 21, `npm ci && npm run browsers:install && npm run verify` passar em checkout limpo;
8. um PR sem segredo e sem rede do feed reproduzir o artifact por snapshot;
9. os gates integrados e humanos registrarem limitações sem alegações excessivas;
10. o usuário autorizar separadamente qualquer deploy em produção.

## 20. Decisão humana

**Q13 — Você aprova esta especificação consolidada como pronta para implementação? Resposta: sim, em 2026-08-15.**

Com o aceite, esta especificação está pronta para orientar uma tarefa futura de implementação. Q13 encerra somente o charting: não inicia nem autoriza implementação, preview externo, deploy ou publicação.
