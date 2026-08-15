# Referência visual aprovada — site pessoal

**Decisão humana:** Q12 aprovada em 2026-08-15 e registrada no ticket [#8](https://github.com/fazedordecodigo/personal_site/issues/8).

Este documento é o contrato visual durável para um checkout limpo. O HTML descartável usado durante a decisão permanece apenas como proveniência local; a implementação e os testes não dependem de `.superpowers/` nem do diretório de visualizações do Codex.

## Proveniência

- Protótipo aprovado: `personal-site-prototype-v3.html`
- SHA-256 do protótipo no momento da aprovação: `a8afe3888e4fed6c200de65c59e743bf895f49a0b26e7e1cb9d9bb4413d54c25`
- Captura desktop exibida ao usuário: JPEG 1425 × 990
- SHA-256 da captura exibida: `b8dcc47a95b8f41708d851f74ce4a2476695ea79f66c4e693afe1eb5530abc25`
- Retrato aprovado: JPEG 400 × 400
- SHA-256 do retrato: `63fb6bdb780c1c3f44fa9e4b2f62dea91f0795427fed85c9b65d3c93eba62ecd`

Os hashes permitem reconhecer os artefatos de decisão quando disponíveis, mas nenhum deles substitui os requisitos verificáveis abaixo.

## Composição

```text
┌──────────────────────────────────────────────────────────────┐
│ EMERSON_        Início Perfil Artigos Newsletter Contato     │
├──────────────────────────────────────────────────────────────┤
│ HERO: eyebrow + badges + H1 + lead + CTAs  │ retrato real   │
├──────────────────────────────────────────────────────────────┤
│ Engenharia+IA │ PyFlunt │ Ensino prático │ Fazedor de Código│
├──────────────────────────────────────────────────────────────┤
│ 01 Perfil: heading e lead                                   │
│ card claro “Como eu trabalho” │ card escuro “Fazedor...”    │
├──────────────────────────────────────────────────────────────┤
│ 02 Artigos: heading, atualização e três cards textuais       │
├──────────────────────────────────────────────────────────────┤
│ Newsletter: copy editorial │ facade/iframe + fallback        │
├──────────────────────────────────────────────────────────────┤
│ Contato + LinkedIn/GitHub/Substack + assinatura              │
└──────────────────────────────────────────────────────────────┘
```

Em desktop, hero, perfil e newsletter usam duas colunas; provas usam quatro; artigos usam três. Em 768 px, as seções principais e artigos usam uma coluna e as provas podem usar duas. Em 320 px, componentes caem para uma coluna quando necessário.

## Hierarquia visual

1. O rosto de Emerson e o H1 são os dois pontos dominantes do primeiro viewport.
2. O nome `EMERSON_` identifica a marca principal.
3. `Cursor Ambassador` e `Devin Ambassador` aparecem juntos, com destaque de pílula, abaixo do eyebrow e acima do H1.
4. O CTA laranja de assinatura domina o CTA contornado de conversa.
5. Fazedor de Código ganha uma superfície escura na seção de perfil e o grande painel de newsletter, sem virar marca-mãe.
6. Artigos são cards textuais; nenhuma capa, logo ou imagem neutra ocupa espaço na produção.
7. Laranja aparece em poucos sinais por viewport: CTA principal, underscore/marca e pequenos acentos.

## Tokens obrigatórios

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

- Display: Space Grotesk 700; H1 e todos os H2 visíveis em caixa alta, H3 com capitalização editorial.
- Corpo: Inter 400/600.
- Eyebrows e dados: JetBrains Mono 500/700.
- Container: central, máximo 1160 px.
- Ritmo: múltiplos de 8 px.
- Raios: 8, 16, 24 px e pílula.
- Divisórias: finas, incluindo tracejado onde separa blocos editoriais.
- Sombras: ausentes ou muito sutis; nenhuma sombra pesada.
- Gradientes: proibidos.
- CTA laranja: texto `#111111`, nunca branco.
- Foco: anel escuro de 2 px com offset de 2 px.
- Alvos não inline: mínimo 44 × 44 CSS px.

## Retrato

- É a única imagem de conteúdo da página.
- Usa crop quadrado, rosto inteiro preservado e sem filtro decorativo pesado.
- Não é ampliado acima de 400 × 400 CSS px.
- O card usa superfície `#FFFFFF`, borda `#DCD9D3`, raio de 24 px, legenda visível e pequeno carimbo tipográfico `{_}` decorativo.
- Em telas estreitas, a imagem ocupa a largura disponível até seu limite intrínseco e não corta o rosto.

## Componentes

### Cabeçalho

- Fundo claro e borda inferior fina.
- Marca à esquerda e navegação à direita em desktop.
- Em telas estreitas, a lista pode quebrar em mais de uma linha; nenhum link é escondido.
- Não existe menu hambúrguer na versão 1.

### Hero

- Grande respiro vertical.
- H1 em caixa alta visual, peso 700 e tinta escura.
- Quebras de linha devem preservar palavras, sem overflow em 160 CSS px de reflow.
- CTAs ficam lado a lado quando houver espaço e empilham sem compressão quando não houver.

### Provas

- Faixa de contraste abaixo do hero.
- Quatro itens com título forte e legenda curta.
- Separação por bordas/divisórias; não parecem botões.

### Perfil

- Um card claro e um card escuro equilibrados.
- Tags são informativas, não controles.
- Card Fazedor de Código é subordinado ao heading pessoal da seção.

### Artigos

- Três cards de altura visual coerente em desktop.
- Kicker, título, resumo, data e link têm hierarquia clara.
- Ausência de imagem reduz a altura sem deixar um slot vazio.
- Estado stale usa somente texto e borda/marrom; não depende apenas de cor.

### Newsletter

- Painel editorial grande com fundo `#111111` e texto `#F7F7F5`; a caixa de interação usa shell `#FFFFFF` e facade `#F7F7F5`.
- Copy e caixa de interação ficam lado a lado em desktop e empilhadas em telas menores.
- Facade deixa claro que o terceiro ainda não foi solicitado.
- Até 480 px, a caixa apresenta apenas explicação curta e link externo.
- Em 481 px ou mais, o botão oferece o carregamento explícito.

### Rodapé

- Fundo escuro, heading de contato e links com foco perceptível.
- A assinatura pessoal fecha a página sem competir com o CTA principal.

## Breakpoints observáveis

| Largura | Contrato |
|---|---|
| 1440 px | container centrado; hero/perfil/newsletter em duas colunas; provas em quatro; artigos em três |
| 768 px | uma coluna nas seções principais; provas em duas se couber; navegação presente |
| 481 px | iframe pode ser ativado e mantém pelo menos 320 px internos |
| 480 px | iframe não é oferecido; link externo é a conversão |
| 320 px | uma coluna, zero overflow horizontal, CTAs e texto íntegros |
| 160 CSS px | reflow sem perda; palavras fortes e navegação quebram com segurança |

## Movimento e interação

- Hover/active são discretos e não deslocam layout.
- Reduced motion remove transforms, transições e smooth scroll não essenciais.
- Nenhuma informação depende de movimento.
- O foco segue a ordem do DOM e nunca fica encoberto pelo cabeçalho.

## Elementos explicitamente excluídos

- banner `PROTÓTIPO — NÃO PRODUÇÃO`;
- switcher flutuante de estados;
- atalhos por setas e parâmetro `?state=`;
- slot neutro `image-fallback`;
- capivara, capas, logos ou selos externos;
- gradientes, paleta alternativa, carrossel, timeline e sombras pesadas;
- Bootstrap, Icomoon e animações do template legado.

## Relação com a especificação

Este arquivo fixa a aparência e responsividade. Copy, URLs, dados, build, segurança, acessibilidade, performance, SEO, CI e autorização de deploy permanecem definidos na [especificação consolidada](../specs/2026-08-15-personal-site.md).
