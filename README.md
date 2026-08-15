# Meu site

Site pessoal estático de Emerson Delatorre, publicado como um artefato fechado em `public/`. O HTML é semântico, o CSS e os assets são locais, e o formulário Substack só é solicitado depois de uma ação explícita no desktop.

## Arquitetura

- `src/index.template.html` é renderizado por `scripts/build-site.mjs`.
- `content/articles.snapshot.json` é a fonte determinística para desenvolvimento e pull requests.
- O modo remoto valida o RSS oficial do Substack no build e só publica quando a resposta é válida; uma falha remota bloqueia o novo artefato e preserva o último deploy válido.
- O build recria `public/` por um manifesto allowlist. Contratos, Nu HTML Checker, Playwright, axe e Lighthouse inspecionam exatamente esse diretório.
- O workflow `.github/workflows/site.yml` valida PRs sem segredo e separa o artifact verificado das lanes opcionais de preview e produção.

## Pré-requisitos

- Node.js `22.23.2` conforme `.nvmrc`.
- Java 21 (Temurin recomendado) para o Nu HTML Checker.
- Dependências instaladas com `npm ci`.
- Chromium e Firefox do Playwright; em Linux, use `npm exec -- playwright install --with-deps chromium firefox` quando necessário.

## Comandos canônicos

```sh
npm ci
npm test
npm run lint
npm run build:snapshot
npm run verify
npm run verify:remote
```

`npm run verify` executa lint, testes unitários, um build por snapshot e todos os gates sobre o mesmo `public/`. `npm run verify:remote` troca somente o modo de artigos para `remote-required` e não deve ser usado em pull requests. Para atualizar o snapshot, execute `npm run snapshot:refresh`, revise os três artigos normalizados e inclua a alteração em uma revisão humana; nenhum workflow faz commit automático.

## Workflow e autorização de publicação

O workflow roda em `ubuntu-24.04`, usa Node 22.23.2, Java 21 e o cron exato `17 12 * * *` (UTC), diariamente às 09:17 no horário de São Paulo. Pull requests usam o snapshot local e não recebem segredo. Pushes e execuções agendadas na `main` validam o RSS remoto.

Preview só pode ser disparado manualmente na `main` com `deployment_target=preview`, `PREVIEW_DEPLOY_ENABLED=true` e o environment protegido `preview`; a ação usa o ambiente nomeado Azure `qa` e não aponta domínio customizado. Produção exige `main`, `PRODUCTION_DEPLOY_ENABLED=true`, o environment protegido `production` e um push, agendamento ou dispatch manual com `deployment_target=production`. Variáveis ausentes ou diferentes de `true` mantêm as duas lanes desativadas. Este repositório não autoriza por si só merge, criação/configuração de environments, habilitação de variáveis, rotação do segredo ou deploy.

Antes do Azure, a execução confirma que o SHA ainda é a ponta de `refs/heads/main` e que é a execução mais recente da lane. O deploy consome apenas o artifact público já validado; não recompila a aplicação.

## Acessibilidade

Os gates locais verificam a página sob controle do projeto em 320, 480, 481, 768 e 1440 px, incluindo teclado, foco e movimento reduzido. O iframe do Substack é conteúdo cross-origin de terceiro: não é lido nem estilizado pela página, pode carregar cookies/telemetria após o clique e seus defeitos internos não são cobertos pelo axe local. Portanto, a entrega não declara conformidade integral enquanto esse conteúdo permanecer incorporado; qualquer declaração pública deve identificar essa limitação.
