# Validação local do site pessoal

Data: 2026-08-15

Branch: `codex/personal-site-v1`

Commit da implementação validada: `acf5c76ce98e98589c1737ca98d4c9067a47544a`

Esta validação cobre o artefato local, os contratos de qualidade, a inspeção visual e os fallbacks sob controle do projeto. Não executa preview Azure, produção, alteração de DNS nem submissão real ao Substack.

## Baseline e runtimes

No início da Task 10 não havia alteração rastreada pendente. Os itens não rastreados preexistentes `AGENTS.md`, `docs/` e `.superpowers/` foram preservados e não entraram nos commits de implementação. Os únicos arquivos de evidência desta validação são este documento e `screenshots/`.

| Item | Resultado |
| --- | --- |
| Node.js | `v22.23.2` |
| npm | `10.9.8` |
| Java padrão do host | OpenJDK `25.0.4` |
| Java usado na validação final | Eclipse Temurin `21.0.12` em `/tmp/personal-site-java21` |
| Playwright | `1.62.1` |
| Chromium | `151.0.7922.34` |
| Firefox | `153.0` |

Java 21 não estava instalado no sistema. Foi usada uma cópia temporária do Temurin em `/tmp`, sem alterar as alternativas do host; o workflow de CI permanece explicitamente configurado para Temurin 21.

## Comandos e resultados

| Comando | Exit code | Evidência |
| --- | ---: | --- |
| `npm ci` | 0 | 520 pacotes instalados; o lockfile preserva as versões pinadas. O npm reportou 10 vulnerabilidades transitivas do baseline pinado (2 low, 1 moderate, 7 high); nenhuma dependência foi atualizada nesta tarefa. |
| `npm run browsers:install` | 0 | Chromium 151.0.7922.34 e Firefox 153.0 instalados; o Playwright usou os builds fallback para Ubuntu 24.04. |
| `JAVA_HOME=/tmp/personal-site-java21 PATH=/tmp/personal-site-java21/bin:$PATH npm run validate:html` | 0 | Nu HTML Checker passou com Java 21. |
| `JAVA_HOME=/tmp/personal-site-java21 PATH=/tmp/personal-site-java21/bin:$PATH npm run verify` | 0 | 33 testes unitários, 24 contratos, Nu, manifesto, 32 testes browser, 7 testes axe e 3 execuções Lighthouse passaram. |
| `npm run build:snapshot` antes da reconstrução | 0 | `build-report.json` indicou `built`, 3 artigos, fonte `snapshot`. |
| `node scripts/check-artifact.mjs public \| sha256sum` antes da reconstrução | 0 | `61483643165393457ac4d44f2c741e1b63ac2a6b2d14bec1479554f9316834b2` |
| remover o `public/` gerado, executar `npm run build:snapshot` e repetir o hash | 0 | O segundo hash foi exatamente `61483643165393457ac4d44f2c741e1b63ac2a6b2d14bec1479554f9316834b2`. |

O relatório de build final está em `build-report.json`; os três relatórios Lighthouse estão em `.lighthouseci/`. Ambos são saídas locais ignoradas pelo Git, não artefatos de publicação nesta validação.

## Evidência visual

As capturas foram feitas em Chromium com `public/` reconstruído após a verificação final, usando viewport de 1000 px de altura e `fullPage: true`.

| Viewport | Arquivo | Dimensão |
| ---: | --- | --- |
| 1440 px | [`desktop-1440.png`](screenshots/desktop-1440.png) | 1440 × 4341 |
| 768 px | [`tablet-768.png`](screenshots/tablet-768.png) | 768 × 4772 |
| 320 px | [`mobile-320.png`](screenshots/mobile-320.png) | 320 × 6027 |
| 480 px | [`breakpoint-480.png`](screenshots/breakpoint-480.png) | 480 × 5168 |
| 481 px | [`breakpoint-481.png`](screenshots/breakpoint-481.png) | 481 × 5291 |

Inspeção das imagens:

- Em 1440 px, o hero preserva a composição em duas colunas, o retrato aprovado, a faixa de quatro provas e a hierarquia de CTA.
- Em 768 px, header, provas e cards refluem sem sobreposição; o retrato permanece inteiro e o conteúdo editorial empilha.
- Em 320 px e 480 px, navegação, texto, cards e newsletter cabem na largura; o controle do iframe não é oferecido e o link externo permanece visível.
- Em 481 px, o controle “Carregar formulário do Substack” reaparece, demonstrando a transição exata do embed.
- O foco visível e o movimento reduzido foram cobertos pelo gate axe/browser; não foi feita alegação de conformidade interna do iframe cross-origin.

## Fallbacks, teclado e reflow

As inspeções foram executadas em Chromium e Firefox, ambos com exit code 0.

- Com CSS bloqueado, o H1, os 5 links da navegação principal, os 3 links de artigos e `Assinar no Substack` permaneceram presentes.
- Com JavaScript desativado, o mesmo conteúdo permaneceu presente, o `iframe` não recebeu `src` e o fallback externo permaneceu utilizável.
- Com a rota do iframe mantida pendente, o status tornou-se `Não foi possível confirmar o carregamento do formulário. Use Assinar no Substack.`, o link externo recebeu destaque e a URL aprovada do frame foi a única URL solicitada pelo pai.
- A ordem de foco observada nos dois browsers foi: `Pular para o conteúdo`, `EMERSON_`, `Início`, `Perfil`, `Artigos`, `Newsletter`, `Contato`, `Assinar o Fazedor de Código`, `Vamos conversar`, três `Ler no Substack →`, `Ver todos os artigos no Substack`, `Carregar formulário do Substack`, `Assinar no Substack`, `LinkedIn`, `GitHub`, `Substack`.
- Para a checagem cross-browser de 200%/reflow foi usado o viewport equivalente de 640 CSS px (metade de 1280 px). Em ambos os browsers: viewport/client/scroll width `640`, H1 visível e CTA primário visível; não houve overflow horizontal. Isso é uma verificação de reflow equivalente, não uma medição de um leitor de tela, Safari ou dispositivo físico.

Não foram executados teste com leitor de tela, Safari, browser mobile real ou inspeção de headers no Azure. Esses pontos pertencem às validações externas autorizadas separadamente.

## Escopo não executado

- Nenhum workflow foi disparado.
- Nenhum environment `preview`/`production` foi criado ou habilitado.
- Nenhum segredo Azure foi usado.
- Nenhum deploy, domínio customizado, DNS ou submissão de formulário foi realizado.
- O modo `remote-required` continua reservado ao workflow confiável; esta evidência local usa o snapshot versionado para manter o build determinístico e sem rede do feed.
