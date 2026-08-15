# Pesquisa — integração do Substack no site pessoal

Data da pesquisa: **2026-08-15**  
Escopo: feed público de artigos e embed público de inscrição de **Fazedor de Código**  
Estado: **pesquisa concluída; nenhuma implementação realizada**

## Decisão recomendada

Usar duas integrações independentes, porque elas têm contratos e riscos diferentes:

1. **Artigos recentes:** obter o RSS no build/deploy, validar e reduzir os dados a um snapshot local, então renderizar três cards estáticos ou carregar um JSON da mesma origem. O navegador **não consegue** consumir o feed do Substack diretamente por CORS. Não manter um proxy público como AllOrigins no caminho crítico.
2. **Inscrição:** incorporar o formulário oficial em um `iframe` responsivo de 320 px de altura, com nome acessível no documento pai e link externo equivalente como fallback. Para minimizar terceiros, preferir carregamento após ação explícita; se a conversão justificar carregamento automático, ao menos usar `loading="lazy"` e documentar a transferência para o Substack.

O feed de artigos **não é** o formulário de inscrição. O primeiro entrega RSS/XML para leitura; o segundo entrega uma aplicação HTML/JavaScript de terceiro que coleta e-mail. A documentação oficial trata os dois recursos separadamente.[S1][S2]

## Fontes primárias e método

| ID | Fonte | Acesso |
| --- | --- | --- |
| S1 | [Substack Help — Is there an RSS feed for my publication?](https://support.substack.com/hc/en-us/articles/360038239391-Is-there-an-RSS-feed-for-my-publication) | 2026-08-15 |
| S2 | [Substack Help — Can I embed a signup form for my Substack publication?](https://support.substack.com/hc/en-us/articles/360041759232-Can-I-embed-a-signup-form-for-my-Substack-publication) | 2026-08-15 |
| S3 | [Feed público de Fazedor de Código](https://fazedordecodigo.substack.com/feed) | 2026-08-15 |
| S4 | [Embed público de Fazedor de Código](https://fazedordecodigo.substack.com/embed) | 2026-08-15 |
| S5 | [Substack Privacy Policy](https://substack.com/privacy) | 2026-08-15 |
| S6 | [WHATWG Fetch — CORS protocol and credentials](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials) | 2026-08-15 |
| S7 | [WCAG 2.2 — Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) | 2026-08-15 |
| S8 | [WCAG 2.2 — Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible) | 2026-08-15 |
| S9 | [WCAG 2.2 — Resize Text](https://www.w3.org/TR/WCAG22/#resize-text) | 2026-08-15 |
| S10 | [WCAG 2.2 — Labels or Instructions](https://www.w3.org/TR/WCAG22/#labels-or-instructions) | 2026-08-15 |
| S11 | [Imagem do item mais recente, URL publicada no `enclosure`](https://substackcdn.com/image/fetch/$s_!WmCz!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F806d76ac-bffb-4ebe-a202-00bfaecc7434_2400x1350.png) | 2026-08-15 |
| S12 | [Imagem do canal, URL publicada no feed](https://substackcdn.com/image/fetch/$s_!erso!,w_256,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F0acf8658-e1eb-4ae2-ada5-96ecf2e7f1b5_1024x1024.png) | 2026-08-15 |
| S13 | [WHATWG HTML — The `iframe` element](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) | 2026-08-15 |
| S14 | [Content Security Policy Level 3 — `frame-src`](https://www.w3.org/TR/CSP3/#directive-frame-src) | 2026-08-15 |

Procedimento executado, sem credenciais e sem enviar o formulário:

- `GET` HTTP/2 com curl 8.18.0, com e sem seguimento de redirect e com `Origin: https://example.test`;
- parsing estrutural do RSS e inventário de todos os seus itens;
- `fetch()` do feed em Google Chrome 151 a partir de uma página servida por `http://127.0.0.1:8765`;
- render do embed em Chrome novo nos viewports internos 320 × 320, 480 × 320 e 800 × 320;
- inspeção do DOM, árvore de acessibilidade do Chrome, ordem de foco, estilos computados, requests e cookies em perfil novo;
- comparação com o mockup aprovado e com o código atual do repositório.

Os resultados HTTP, DOM e browser abaixo são observações pontuais dos endpoints S3 e S4 em 2026-08-15; não constituem SLA nem contrato de estabilidade do Substack.

## Estado atual do repositório

O código atual ainda aponta para `https://www.fazedordecodigo.com/feed.xml`, consulta o feed em runtime por AllOrigins, tenta achar uma imagem dentro de `description` e limita o resultado a seis itens. Ver [`js/blog-feed.js`](/home/madruga/projetos/personal_site/js/blog-feed.js:12).

O renderer concatena título, link, resumo e URL de imagem remotos em uma string HTML, inclusive dentro de `style="background-image"`, e então usa `.html(...)`. Isso cria uma superfície de injeção desnecessária e não deve ser transportado para a integração nova. Ver [`js/main.js`](/home/madruga/projetos/personal_site/js/main.js:193).

O mockup aprovado prevê três artigos e um bloco de inscrição em duas colunas, que passa a uma coluna abaixo de 820 px. Ele também explicita que a moldura pessoal deve criar contexto sem tentar reestilizar o interior do iframe. Ver [`personal-adaptation.html`](/home/madruga/projetos/personal_site/.superpowers/brainstorm/938452-1786790089/content/personal-adaptation.html:126).

## Validação HTTP

| Superfície | Resultado observado | Consequência |
| --- | --- | --- |
| `GET /feed` | `200`, sem redirect; `Content-Type: application/xml; charset=utf-8`; `Cache-Control: no-cache`; `ETag`; HSTS; sem `Access-Control-Allow-Origin`.[S3] | É um feed RSS válido, mas não é consumível por `fetch()` cross-origin no browser. |
| `GET /feed` com `Origin` | `200`, ainda sem `Access-Control-Allow-Origin`.[S3][S6] | Uma resposta HTTP bem-sucedida não significa que JavaScript de outra origem possa ler o corpo. |
| `GET /embed` | `200`, sem redirect; `Content-Type: text/html; charset=utf-8`; `Cache-Control: no-cache`; HSTS.[S4] | Pode ser usado diretamente como documento de iframe. |
| Framing de `/embed` | `Content-Security-Policy: frame-ancestors *`; nenhum `X-Frame-Options` foi observado.[S4] | O endpoint permitiu o framing testado. O provedor pode alterar essa política. |

Ambos os endpoints responderam diretamente na URL HTTPS fornecida. Não houve cadeia intermediária de redirects no teste.[S3][S4]

### Cache e detecção de mudança

Uma requisição condicional ao feed com o `ETag` obtido minutos antes retornou `200`, um novo `ETag` e um novo `lastBuildDate`. Depois de remover apenas `lastBuildDate`, as serializações estruturais dos dois XML produziram o mesmo SHA-256.[S3]

Conclusão: neste endpoint, `lastBuildDate` refletiu a hora da requisição, não a publicação do artigo mais recente. Não usá-lo como sinal de conteúdo novo e não depender de `304`. A identidade estável deve vir dos `guid`/links dos itens; a ordenação deve usar `pubDate` validado.

### Cookies já na resposta HTTP

Mesmo os `GET` anônimos de `/feed` e `/embed` responderam com cookies de experimento do Substack e proteção Cloudflare (`ab_experiment_sampled`, `ab_testing_id` e `__cf_bm`) no teste curl.[S3][S4] Obter o RSS no build evita que essa chamada remota faça parte da navegação do visitante.

## CORS real do feed

O teste em navegador foi feito de uma origem HTTP diferente, não de `file:` nem de uma simulação de header. O Chrome registrou que a leitura foi bloqueada porque a resposta não continha `Access-Control-Allow-Origin`; o JavaScript recebeu `TypeError: Failed to fetch`.[S3][S6]

Portanto:

- `fetch("https://fazedordecodigo.substack.com/feed")` no site estático não é uma solução viável hoje;
- `mode: "no-cors"` não ajuda, porque entrega uma resposta opaca cujo corpo não pode ser lido;
- trocar jQuery por `fetch`, Axios ou outro cliente não altera a política do navegador;
- o comportamento deve ser considerado externo e sujeito a mudança; mesmo que o Substack passe a liberar CORS no futuro, a estratégia de build continua reduzindo dependências em runtime.

## Estrutura observada do RSS

A documentação oficial confirma o padrão `https://<publicação>.substack.com/feed`.[S1] O endpoint de Fazedor de Código retornou RSS 2.0 gerado pelo Substack.[S3]

### Canal

Campos presentes e úteis no `channel`:

- `title`: `Fazedor de Código`;
- `description`: `Comunidade mão na massa de quem aprende programação fazendo.`;
- `link`: `https://fazedordecodigo.substack.com`;
- `image/url`, `image/title` e `image/link`;
- `generator`: `Substack`;
- `language`: `pt-br`;
- `lastBuildDate`, com a ressalva de volatilidade já descrita.[S3]

O feed também expõe `webMaster`, e-mails em namespaces de podcast e copyright. Esses campos não são necessários para os cards e não devem ser copiados ao snapshot público do site.[S3]

### Itens

Foram retornados **15 itens**, do mais recente `Cursor Weekly — Edição #11` (`Thu, 13 Aug 2026 00:48:38 GMT`) ao mais antigo `Cursor Weekly — Edição #01` (`Mon, 01 Jun 2026 15:39:39 GMT`). Todos os 15 continham `title`, `description`, `link`, `guid`, `dc:creator`, `pubDate`, `enclosure` e `content:encoded`.[S3]

| Campo | Uso recomendado | Observação |
| --- | --- | --- |
| `guid` | identidade/deduplicação | No recorte observado, é igual ao link do post e tem `isPermaLink="false"`.[S3] |
| `title` | título do card, como texto | Tratar como dado não confiável e aplicar limite de tamanho. |
| `description` | resumo curto | Veio em CDATA, sem tags, mas com entidades HTML numéricas literais como `&#226;`; decodificar uma vez para texto e depois escapar/renderizar com `textContent`.[S3] |
| `link` | destino do card | Todos os links observados usaram HTTPS e o host `fazedordecodigo.substack.com`, sob `/p/`.[S3] |
| `dc:creator` | autoria opcional | Todos os itens observados informaram `Emerson Delatorre`.[S3] |
| `pubDate` | instante de publicação | Valor RFC em GMT; preservar como instante e formatar em timezone explicitamente decidido. |
| `enclosure@url` | imagem principal | Presente nos 15 itens; é a fonte mais direta para thumbnail.[S3] |
| `content:encoded` | **não usar nos cards** | Contém o artigo em HTML extenso, com links, imagens, botões e outros elementos controlados remotamente.[S3] |

Não truncar `pubDate` para `YYYY-MM-DD` e depois reparsá-lo. O primeiro item, por exemplo, é `2026-08-13T00:48:38Z`, que ainda corresponde a 12/08 em `America/Sao_Paulo`. Guardar o instante e usar `Intl.DateTimeFormat` com timezone explícito evita deslocamentos acidentais.[S3]

### Limite observável

O número **15** é apenas o tamanho retornado nesta publicação e nesta data. A página oficial do RSS documenta a URL, mas não garante quantidade, paginação, janela histórica, ordem nem SLA.[S1][S3]

Não assumir que o feed seja arquivo completo ou que sempre venha ordenado. O consumidor deve validar as datas, ordenar de forma decrescente e então selecionar os três itens pedidos pelo mockup.

### Imagens

Todos os 15 itens possuíam `enclosure`, porém o metadata não é confiável para inferir formato ou tamanho: cada `length` era `0` e cada `type` dizia `image/jpeg`, embora as URLs apontassem para originais `.png`.[S3]

Uma amostra do `enclosure` do item mais recente respondeu `200` como `image/png`, 2400 × 1350 e 62.427 bytes; a imagem do canal respondeu `200` como PNG 256 × 256 e 9.227 bytes. As duas respostas usaram cache público de um ano e vieram de `substackcdn.com`.[S11][S12]

Consequências:

- usar a URL de `enclosure`, mas deixar o browser detectar o formato real;
- aplicar `aspect-ratio`, dimensões reservadas e `object-fit` no card para evitar layout shift;
- aceitar apenas HTTPS e host `substackcdn.com`; se não passar na validação ou falhar no carregamento, usar imagem local neutra;
- usar `loading="lazy"` e `referrerpolicy="no-referrer"` nas thumbnails remotas;
- não procurar `<img>` em `description`: nenhum dos 15 resumos observados continha markup de imagem.[S3]

## Embed oficial de inscrição

A documentação oficial descreve o recurso como **signup form**, compatível com sites que suportam iframe, e declara que o formulário não é customizável. A configuração do Substack pode esconder o nome e o logo da publicação, mas o CSS interno continua pertencendo ao provedor.[S2]

Isso confirma a decisão do mockup: estilizar a moldura e a chamada editorial no site pessoal, sem tentar atravessar a fronteira cross-origin para reestilizar o documento interno.

### Responsividade observada

O embed foi renderizado com viewport interno de **320 px de altura**:

| Largura interna | `scrollWidth / clientWidth` | `scrollHeight / clientHeight` | Resultado visual |
| ---: | ---: | ---: | --- |
| 320 px | 320 / 320 | 320 / 320 | conteúdo, formulário, termos e marca visíveis; sem corte |
| 480 px | 480 / 480 | 320 / 320 | sem overflow |
| 800 px | 800 / 800 | 320 / 320 | sem overflow |

A marca Substack terminou em `y = 308 px` nos três testes. Assim, **320 px é a menor altura testada que passou**, não um mínimo universal demonstrado abaixo disso.[S4]

O formulário manteve input e botão na mesma linha em 320 px. A largura do formulário foi 296 px nesse viewport e 370 px nos viewports maiores.[S4]

Um iframe não ganha automaticamente a altura do documento cross-origin. A integração deve declarar `height: 320px` (ou `min-height: 320px`) e `width: 100%`; `height: auto` não resolve esse caso.[S13]

### Acessibilidade observada

Pontos positivos no DOM e na árvore de acessibilidade do Chrome:

- documento com `lang="pt-br"` e `dir="ltr"`;
- nome da publicação em `h1`;
- logos com textos alternativos `Logo` e `Substack`;
- links legais com nomes expostos;
- textbox exposto como `Digite seu e-mail...` e botão como `Inscreva-se`;
- o botão, inicialmente desabilitado, tornou-se habilitado com um endereço sintaticamente válido e ficou alcançável por `Tab`.[S4]

Limitações relevantes, pertencentes ao componente de terceiro:

1. O input de e-mail não possui `<label>`, `aria-label` nem `aria-labelledby`; seu nome acessível deriva somente do placeholder. O placeholder desaparece durante a digitação, portanto o site pai deve manter instrução visível e não depender do iframe como única explicação do campo.[S4][S10]
2. O placeholder medido foi `rgb(182,182,182)` sobre `rgb(232,232,230)`, contraste aproximado de **1,65:1**. O texto branco de 14 px do botão sobre `rgb(255,106,0)` mediu aproximadamente **2,87:1**. Ambos ficam abaixo de 4,5:1 para texto normal.[S4][S7]
3. Input e botão focados mantiveram `outline: none`; borda e sombra computadas não apresentaram mudança distinta em relação ao estado normal. Não foi observado indicador visual de foco robusto.[S4][S8]
4. O `<meta name="viewport">` inclui `maximum-scale=1` e `user-scalable=0`, restringindo zoom no documento do embed.[S4][S9]

Como o Substack declara o embed não customizável, esses pontos não podem ser corrigidos pelo CSS do site pai.[S2] Recomenda-se:

- nomear o iframe com `title="Inscrição na newsletter Fazedor de Código"`;
- manter heading e instrução visíveis fora do iframe;
- oferecer um link HTML normal para assinar no Substack, antes ou logo depois do iframe;
- não fazer do formulário incorporado a única rota de conversão;
- repetir a auditoria quando o provedor mudar o embed.

### JavaScript e fallback

O HTML inicial contém um formulário, mas o botão chega desabilitado e só é habilitado pela aplicação JavaScript. O documento também inclui uma mensagem `noscript` informando que o site requer JavaScript.[S4]

Com JavaScript desabilitado, o formulário permaneceu visualmente presente no teste, porém inoperante. O link externo de assinatura é, portanto, fallback obrigatório para bloqueadores de script, falhas do CDN e indisponibilidade da aplicação do Substack.

### Privacidade, terceiros e cookies

O próprio formulário exibe links para os Termos, Política de Privacidade e aviso de coleta de informações. A Política de Privacidade do Substack declara coleta de e-mail, dados de navegador/dispositivo, IP e uso de cookies; também distingue o tratamento pelo Substack das responsabilidades do Creator.[S4][S5]

Em uma única carga anônima, direta e com perfil novo do Chrome, foram observadas **180 requisições**. Esse número é volátil, mas demonstra que o iframe não é um recurso isolado. Os hosts tocados incluíram:[S4]

- `fazedordecodigo.substack.com`, `substack.com` e `substackcdn.com`;
- `fonts.gstatic.com`;
- `js.sentry-cdn.com`;
- `static.cloudflareinsights.com` e `cloudflareinsights.com`;
- `www.datadoghq-browser-agent.com`;
- `www.googletagmanager.com`;
- `googleads.g.doubleclick.net` e `ad.doubleclick.net`;
- `www.google.com` e `www.google.com.br`.

Cookies armazenados no mesmo ensaio, sem registrar valores, incluíram `ab_experiment_sampled`, `ab_testing_id`, `ajs_anonymous_id`, `cf_clearance`, `__cf_bm`, `AWSALBTG`, `AWSALBTGCORS`, `cookie_storage_key`, `visit_id`, `_gcl_au`, `test_cookie` (`.doubleclick.net`) e `_dd_s`.[S4]

Essa medição foi feita com o embed como documento de topo para permitir inspeção. Quando ele estiver realmente enquadrado, armazenamento e envio podem mudar conforme navegador, região e política de cookies de terceiros; essa superfície não foi validada de ponta a ponta. A Política do Substack também informa que controles de cookie variam por jurisdição e navegador.[S5]

`loading="lazy"` reduz carregamento antecipado quando a seção está longe da viewport, mas não equivale a consentimento. Se minimização de terceiros for requisito, a opção mais forte é um placeholder estático com botão **Carregar formulário do Substack**, que só atribui `src` ao iframe após ação explícita. Deve continuar existindo um link direto que funcione sem JavaScript.

## Estratégia proposta para os artigos

### Preferida: snapshot no build/deploy

Fluxo:

1. Um script pequeno, executado no build/deploy, faz `GET` de S3 com timeout.
2. O script rejeita redirect para host inesperado, resposta não `200`, payload acima do limite escolhido e XML inválido.
3. O parser não resolve DTD nem entidades externas.
4. Cada item é normalizado para um contrato mínimo: `id`, `title`, `excerpt`, `url`, `publishedAt`, `imageUrl` e `author` opcional.
5. URLs são aceitas apenas por esquema e host allowlisted; strings recebem limites de tamanho.
6. Itens com data inválida ou URL inválida são descartados; o restante é ordenado por instante e reduzido aos três mais recentes.
7. O resultado vira HTML estático ou `data/substack-posts.json` servido pela mesma origem.
8. Se a atualização falhar, manter o último snapshot válido. Se não houver snapshot, mostrar somente fallback local e link **Ver todos os artigos no Substack**.

Guardrails propostos, a validar na especificação de implementação:

- limite do XML: 1 MiB (o corpo observado teve 231.839 bytes);
- timeout curto e uma repetição no build, nunca loop aberto;
- `title` como texto, sem HTML;
- `excerpt` decodificado uma vez e materializado como texto, com limite editorial;
- links somente em `https://fazedordecodigo.substack.com/p/…`;
- imagens somente em `https://substackcdn.com/…`, com fallback local;
- data ISO completa, formatada em `pt-BR` com timezone acordado;
- arquivo gerado com timestamp próprio `fetchedAt`, sem reaproveitar o `lastBuildDate` volátil;
- UI identificando a última atualização quando estiver usando snapshot antigo.

Na renderização em JavaScript, criar nós e atribuir `textContent`, `href` e `src` após validação. Não concatenar os campos do feed em `innerHTML`, atributo `style` ou handlers. Em links com nova aba, usar `rel="noopener noreferrer"`.

### Alternativa se atualização em runtime for indispensável

Criar um endpoint same-origin controlado (por exemplo, função associada ao Azure Static Web Apps) que:

- tenha upstream fixo S3, sem parâmetro de URL aberto;
- imponha timeout e limite de resposta;
- valide e reduza o XML antes de responder JSON;
- use cache e stale-if-error;
- exponha somente os campos do contrato local;
- tenha observabilidade e rate limit.

Essa alternativa remove o bloqueio de CORS para o browser, mas adiciona infraestrutura, custo operacional e uma superfície pública. Só se justifica se a defasagem do snapshot de build for inaceitável.

### Estratégias rejeitadas

- **`fetch()` direto do browser:** bloqueado por CORS no teste.[S3][S6]
- **`mode: "no-cors"`:** resposta opaca e ilegível pelo JavaScript.[S6]
- **AllOrigins ou proxy público equivalente:** terceiro não controlado no caminho crítico, sem garantia de disponibilidade, integridade, privacidade ou política de cache.
- **Injetar `content:encoded`:** amplia a superfície de XSS e permite que markup remoto altere a página.[S3]
- **Fallback com artigos fictícios ou antigos sem identificação:** mascara falha e pode contradizer o rótulo “mais recentes”.

## Contrato recomendado do iframe

Markup de referência para a especificação, não implementação:

```html
<iframe
  src="https://fazedordecodigo.substack.com/embed"
  title="Inscrição na newsletter Fazedor de Código"
  width="100%"
  height="320"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  style="display:block;width:100%;min-height:320px;border:0;background:#fff"
></iframe>
<p>
  <a
    href="https://fazedordecodigo.substack.com/"
    rel="noopener noreferrer"
  >Assinar no Substack</a>
</p>
```

Notas:

- 320 px é a altura mínima **testada**, não promessa do provedor.[S4]
- Não usar `scrolling="no"`; o atributo é obsoleto e esconderia regressões de tamanho.[S13]
- Não adicionar `sandbox` sem validar o fluxo completo. O formulário precisa de scripts e forms; links legais abrem nova aba e o pós-submit pode navegar ou abrir outras superfícies. O submit não foi exercitado nesta pesquisa.
- Para CSP no documento pai, o carregamento inicial requer `frame-src https://fazedordecodigo.substack.com`. Scripts, fonts e telemetria internos pertencem ao documento cross-origin e não precisam ser incluídos em `script-src`/`connect-src` do pai. Antes de fechar uma CSP estrita, testar a navegação pós-inscrição.[S13][S14]
- O iframe deve ocupar a área branca do mockup; cantos, espaçamento e contraste da moldura ficam sob controle do site, mas não o conteúdo interno.[S2]

## Fallbacks por falha

| Falha | Comportamento esperado |
| --- | --- |
| Fetch do RSS falha no build | conservar último snapshot válido; registrar falha; não sobrescrever com array vazio |
| Snapshot ausente ou inválido | esconder cards dinâmicos; mostrar texto editorial e link para a publicação |
| Imagem remota falha | imagem local neutra, preservando espaço e texto do card |
| JavaScript do site falha | cards essenciais já presentes no HTML, se possível |
| Iframe/CDN/scripts bloqueados | link HTML normal para assinar no Substack permanece visível |
| Embed muda de altura | permitir scroll como último recurso e sinalizar falha no teste visual; ajustar somente após nova medição |
| Terceiros não aceitos | não carregar o iframe; manter CTA externo e explicação |

## Critérios de aceite para a futura implementação

### Artigos

- Nenhuma requisição do browser a S3 nem a proxy CORS para obter o XML.
- Três itens mais recentes depois de validação e ordenação, sem confiar na ordem ou quantidade do feed.
- Título e resumo inseridos como texto; `content:encoded` nunca renderizado.
- URLs e hosts validados; links externos usam `rel="noopener noreferrer"`.
- Data formatada com timezone explicitamente decidido.
- Imagem por `enclosure`, com espaço reservado, lazy loading e fallback local.
- Snapshot stale identificado e fallback sem artigos fictícios.
- Falha do feed não remove conteúdo já válido.

### Inscrição

- `iframe` com `title` útil, largura 100% e altura interna mínima testada de 320 px.
- Sem overflow em 320, 480 e 800 px; conteúdo e links legais visíveis.
- Heading/instrução fora do iframe e link externo equivalente sempre disponível.
- Navegação completa por teclado no site pai e retorno de foco previsível.
- Estratégia de privacidade escolhida explicitamente: click-to-load ou lazy-load documentado.
- Teste real de inscrição em staging, com endereço autorizado, incluindo erro, sucesso, confirmação e retorno — pendente desta pesquisa.
- Verificação com pelo menos leitor de tela, zoom e navegadores-alvo — pendente desta pesquisa.

## Superfícies não testadas

- envio de e-mail, validação server-side, confirmação, double opt-in, unsubscribe e tratamento de erro;
- fluxo de recomendações, pledge ou planos pagos após a inscrição;
- estado autenticado, assinante existente e conta bloqueada;
- comportamento regional de consentimento, LGPD/GDPR e cookies em iframe de terceiro;
- Safari, Firefox, WebView, iOS/Android reais e bloqueadores de conteúdo;
- leitor de tela real, alto contraste, zoom de página e magnificação móvel;
- embed com largura abaixo de 320 px ou altura abaixo de 320 px;
- mudança de logo/descrição/configuração “Show pub logo on embed”;
- feed privado, posts pagos, seções, podcast/vídeo ou mais de 15 itens;
- rate limits, SLA, versionamento ou aviso de breaking change do Substack;
- comportamento de CORS futuro;
- execução real do gerador no pipeline do Azure Static Web Apps;
- indisponibilidade prolongada de `substackcdn.com` e política de hotlink;
- CSP final durante e depois do submit do formulário.

## Conclusão

O feed está saudável e estruturado o suficiente para gerar cards, mas o CORS real elimina o consumo direto no navegador. A solução de menor superfície é materializar um snapshot sanitizado no build e manter um último valor válido.

O embed oficial cabe no layout aprovado a partir de 320 × 320 nos tamanhos testados e o endpoint permite framing. Contudo, ele traz JavaScript, telemetria, cookies e limitações internas de acessibilidade que o site pai não consegue corrigir. A especificação deve tratá-lo como componente externo: nome acessível, moldura própria, fallback equivalente, política de carregamento consciente de privacidade e teste pós-submit antes da publicação.[S2][S4][S5]

[S1]: https://support.substack.com/hc/en-us/articles/360038239391-Is-there-an-RSS-feed-for-my-publication "Substack Help sobre RSS — acesso em 2026-08-15"
[S2]: https://support.substack.com/hc/en-us/articles/360041759232-Can-I-embed-a-signup-form-for-my-Substack-publication "Substack Help sobre embed de inscrição — acesso em 2026-08-15"
[S3]: https://fazedordecodigo.substack.com/feed "Feed público de Fazedor de Código — acesso em 2026-08-15"
[S4]: https://fazedordecodigo.substack.com/embed "Embed público de Fazedor de Código — acesso em 2026-08-15"
[S5]: https://substack.com/privacy "Substack Privacy Policy — acesso em 2026-08-15"
[S6]: https://fetch.spec.whatwg.org/#cors-protocol-and-credentials "WHATWG Fetch CORS — acesso em 2026-08-15"
[S7]: https://www.w3.org/TR/WCAG22/#contrast-minimum "WCAG 2.2 Contrast Minimum — acesso em 2026-08-15"
[S8]: https://www.w3.org/TR/WCAG22/#focus-visible "WCAG 2.2 Focus Visible — acesso em 2026-08-15"
[S9]: https://www.w3.org/TR/WCAG22/#resize-text "WCAG 2.2 Resize Text — acesso em 2026-08-15"
[S10]: https://www.w3.org/TR/WCAG22/#labels-or-instructions "WCAG 2.2 Labels or Instructions — acesso em 2026-08-15"
[S11]: https://substackcdn.com/image/fetch/$s_!WmCz!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F806d76ac-bffb-4ebe-a202-00bfaecc7434_2400x1350.png "Imagem do item mais recente — acesso em 2026-08-15"
[S12]: https://substackcdn.com/image/fetch/$s_!erso!,w_256,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F0acf8658-e1eb-4ae2-ada5-96ecf2e7f1b5_1024x1024.png "Imagem do canal — acesso em 2026-08-15"
[S13]: https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element "WHATWG HTML iframe — acesso em 2026-08-15"
[S14]: https://www.w3.org/TR/CSP3/#directive-frame-src "CSP3 frame-src — acesso em 2026-08-15"
