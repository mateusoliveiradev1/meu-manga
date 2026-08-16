---
name: Plataforma Dark Premium
description: Uma plataforma de leitura de manga escura, densa e moderna — as capas são o produto, o chrome é discreto
colors:
  bg: "#0a0a0f"
  bg-deep: "#060609"
  surface: "#121218"
  surface-2: "#1b1b23"
  line: "#262630"
  line-soft: "#1d1d25"
  paper: "#f4f1e9"
  paper-dim: "#cfc9ba"
  ink: "#ecebe6"
  ink-dim: "#a2a0ab"
  ink-faint: "#858279"
  accent: "#f5c518"
  accent-bright: "#ffd94a"
  accent-ink: "#191204"
  green: "#4ade80"
  cyan: "#22d3ee"
  orange: "#f59e0b"
  magenta: "#e879f9"
  red: "#f87171"
  red-deep: "#7f1d1d"
typography:
  display:
    fontFamily: "'Anton', 'Arial Black', system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 4.5vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0.005em"
  headline:
    fontFamily: "'Anton', 'Arial Black', system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 3vw, 1.7rem)"
    fontWeight: 400
    lineHeight: 1.12
  title:
    fontFamily: "'Anton', 'Arial Black', system-ui, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.25
    textTransform: "uppercase"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.6
    fontWeight: 400
  small:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.85rem"
    lineHeight: 1.5
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "1rem"
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "0.35rem"
  sm: "0.7rem"
  md: "1.2rem"
  lg: "1.6rem"
  xl: "2.4rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.2rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-bright}"
    shadow: "0 8px 24px rgba(245,197,24,0.18)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
  panel:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.bg-deep}"
    textColor: "{colors.ink}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.8rem"
---

# Design System: Plataforma Dark Premium

## Overview

**Creative North Star: "Plataforma Dark Premium"**

Uma plataforma de leitura de manga escura, densa e moderna — no nível de MangaDex/MangaPlus no modo escuro. O chão é um preto-azulado limpo (sem textura), as superfícies são grafite com borda de 1px, e **as capas são o produto**: a home abre com um banner da obra em destaque (capa grande + sinopse + CTA "Ler do início") e uma grade de capas larga que ocupa a largura toda. Cada **capítulo também tem capa** (opcional, definida no form do capítulo), exibida como miniatura na lista da obra e no painel — a estante lê obra e volume. O chrome é discreto: um amarelo shonen como única voz de marca, tipografia Anton para os gritos de capa, JetBrains Mono para os números. O leitor é a sala mais escura: a página de manga flutua sobre o vazio, com zoom, contador em pílula e fade-in.

Sem textura de meio-tom, sem molduras duplas, sem divisórias de velocidade, sem carimbos — o design de plataforma moderna: conteúdo denso, capas grandes, hierarquia clara.

**Key Characteristics:**
- Chão tinta limpo (#0a0a0f), sem textura; superfícies grafite com borda 1px e cantos 12-16px.
- **Banner em destaque** na home: capa 3:4 grande, gradientes de brilho sutis (amarelo + índigo), título, sinopse (3 linhas), meta e CTAs.
- Grade de capas **larga** (6 colunas no desktop, 2 no mobile) — capas grandes com hover de elevação + brilho.
- Um único amarelo shonen (#f5c518) como voz de marca: botões, foco, números, o mark do logo.
- O leitor é a superfície mais escura: página de manga com fade-in, zoom (duplo clique), contador em pílula central e barra de progresso amarela.
- Índices de seção numerados em mono (01, 02, ★) — paginação de catálogo.

## Colors

Paleta de plataforma premium: chão preto-azulado, superfícies grafite, capas vibrantes como cor primária.

### Primary
- **Amarelo Shonen** (#f5c518): a única voz de marca — botões primários, foco, números, o mark do logo. Usado com moderação (menos que antes: links comuns são claros, o amarelo é reservado a ações).
- **Amarelo Claro** (#ffd94a): hover do botão primário.
- **Tinta do Amarelo** (#191204): texto sobre fundo amarelo.

### Secondary (status)
- **Verde** (#4ade80): "Em publicação" e "Publicado".
- **Ciano** (#22d3ee): "Concluída".
- **Laranja** (#f59e0b): "Em pausa".
- **Magenta** (#e879f9): "Em breve".
- **Vermelho** (#f87171): ações destrutivas e erros.

### Neutral
- **Tinta** (#0a0a0f): chão, sem textura.
- **Tinta Profunda** (#060609): campos e o vazio do leitor.
- **Superfície** (#121218) / **Superfície 2** (#1b1b23): painéis e hover de linha.
- **Fio** (#262630) / **Fio Suave** (#1d1d25): bordas de 1px.
- **Tinta de Texto** (#ecebe6) / **Suave** (#a2a0ab) / **Fraca** (#858279): hierarquia de texto; a fraca passa WCAG AA (≥4.5:1) sobre tinta e superfície.

### Named Rules
**A Regra da Capa.** A capa é o produto: nenhum chrome compete com a arte. O amarelo é reservado a ações; links comuns são claros; badges de status são pílulas tingidas discretas.
**A Regra da Superfície Limpa.** Sem textura, sem molduras duplas, sem enfeites de quadrinho — elevação é superfície + borda 1px + sombra suave. Densidade vem do conteúdo, não do ornamento.

## Typography

**Display Font:** Anton (com fallback Arial Black)
**Body Font:** system-ui stack
**Data Font:** JetBrains Mono

### Hierarchy
- **Display** (Anton, clamp(1.9rem → 3rem)): o banner em destaque e o wordmark.
- **Headline** (Anton, clamp(1.3rem → 1.7rem)): títulos de seção (h2).
- **Título** (Anton, 0.98rem, caixa alta): títulos de obra nos cards.
- **Corpo** (system-ui, 1rem, 1.6): sinopses, comentários, texto de leitura (68ch).
- **Mono** (JetBrains Mono): números de capítulo, contadores, índices de seção.

### Named Rules
**A Regra do Grito Único.** Em ênfase, só peso ou escala — nunca gradiente em texto. O Anton já grita sozinho; em títulos de seção, um índice mono amarelo (01, 02) marca a paginação de catálogo.

## Layout

Coluna central ampla (72rem) para densidade: a grade de capas respira na largura toda. O banner em destaque abre a home (capa 3:4 + corpo com gradientes sutis de brilho); as seções seguem com cabeçalho indexado e hairline de 1px entre blocos. Quebra mobile (720px): o banner empilha (capa até 11rem em cima), a grade vira 2 colunas, o leitor mantém a barra compacta.

## Elevation & Depth

Elevação é superfície + borda 1px + sombra suave (0 14px 34px rgba(0,0,0,0.45) em capas; 0 18px 50px no leitor). Hover de capa: levanta 4-5px com borda clareada e sombra maior. Nada de sombras duras fora do mark do logo (0 2px 0).

## Shapes

Cantos de plataforma: cards e painéis 12px, banner 16px, botões 10px, campos 10px, badges e tags em pílula. Sem molduras duplas.

## Components

### Buttons
- **Primário:** amarelo com tinta-do-amarelo, canto 10px; hover clareia + sombra amarela difusa; ativo assenta.
- **Fantasma:** transparente com borda de fio; hover acende borda e texto em amarelo.
- **Perigo:** vermelho, usado apenas para destruição (sempre com confirmação).

### Badges & Tags
- **Badge de status:** pílula com texto tingido (verde/ciano/laranja/magenta) e fundo de superfície — discreta, nunca compete com a capa.
- **Tag:** pílula neutra de fio com texto suave.

### Cards (shelf)
- **Capa:** 3:4, canto 12px, borda 1px, sombra; hover eleva e clareia a borda.
- **Painel de conteúdo:** superfície, borda 1px, canto 12px, padding 1.2rem (lista de capítulos, formulários, comentários).
- **Banner em destaque:** canto 16px, superfície com dois glows radiais (amarelo e índigo), capa grande à esquerda.

### Inputs
- Fundo tinta-profunda, borda 1px de fio, canto 10px; foco com borda amarela + anel difuso; caret amarelo.

### Navigation
- **Barra do site:** fundo blur, borda inferior 1px; links claros (não amarelos) com hover de superfície; o nome do leitor logado é um link para `/perfil`.
- **Busca no header:** campo pill compacto com ícone de lupa à direita; no mobile vive dentro do menu em bottom sheet. O envio faz GET para `/obras?q=…`, preservando uma única rota canônica de descoberta.
- **Gêneros:** dropdown `details/summary` (sem JS) com a lista canônica de gêneros (`src/lib/genres.ts`), cada um linkando para `/genero/[slug]`; obras marcam gêneros por chips no painel e tags livres continuam válidas.
- **Comunidade:** item de primeiro nível no desktop e no menu mobile. Usuários autenticados recebem sino com contador não lido; perfis e nomes de comentários são sempre clicáveis.
- **Marca:** painel amarelo com o slash inclinado (o "volume" da marca); inclina -6° no hover.
- **Barra do leitor:** compacta, escura; Ampliar · Página · Rolagem.

### Signature Component — o Leitor
Superfície mais escura do site: a página de manga flutua sobre o vazio (#050508) com moldura 6px e sombra profunda; fade-in de 0.3s ao carregar no modo página (com fallback `img.complete` para cache; no modo rolagem as páginas entram visíveis, em fluxo); zoom por duplo clique ou botão (160%, rolagem própria, esconde a navegação); contador de página em pílula central (mono, amarelo sobre negro); barra de progresso 3px amarela com transform scaleX; setas de navegação em opacidade baixa (0.25 → 1 no hover/foco); três modos — **rolagem é o padrão** (scroll nativo do documento, estilo MangaDex, com restauro de posição e progresso salvos com throttle), página (single-page com zoom) e **dupla** (duas páginas lado a lado no desktop, avançando de 2 em 2; no mobile vira uma por linha) — o modo é lembrado por dispositivo.

**Páginas duplas (spreads):** detectadas automaticamente pela proporção da imagem (largura > altura, medida no cliente ao carregar — sem metadados no banco). No modo Página a spread renderiza em largura dupla com pan horizontal: o toque/clique à direita avança para a metade 2 e depois para a próxima página (à esquerda faz o caminho inverso); setas do teclado repetem o gesto; o botão Ampliar dá lugar a um hint "página dupla". No modo Dupla uma spread ocupa a linha inteira. No modo Rolagem renderiza naturalmente em fluxo. O fim do capítulo é um card limpo com CTA de próximo capítulo.

## Do's and Don'ts

### Do:
- **Do** deixar as capas grandes e respirando — elas são o produto.
- **Do** manter as superfícies limpas (1px, sem textura) e o amarelo reservado a ações.
- **Do** usar ícones SVG de traço consistente; nunca emoji ou glifos Unicode no lugar de ícones.
- **Do** preencher a home com conteúdo: banner + grade + comentários.
- **Comentários em dois níveis**: por capítulo (no fim do leitor) e por obra (seção própria na página da obra, com contagem no cabeçalho).
- **Rating em estrelas** (1–5): widget interativo na página da obra — média com uma casa decimal + contagem de notas; leitor logado destaca a própria nota (hover prévia); convidados veem média e hint "entre para dar sua nota".
- **Rodapé** de estúdio: colunas (marca + tagline + contador de leituras, navegação com **Sobre**, estúdio com último capítulo) sobre fundo profundo, com linha de copyright; empilha em mobile. O acesso ao painel fica **só no header** (link "Painel", visível apenas para admin) — o rodapé não expõe ferramentas de autor.
- **Página Sobre** (`/sobre`): narrativa do estúdio em prosa curta + faixa de estatísticas (obras/capítulos/comentários em cápsulas) + grid de "Como funciona" + FAQ em painel único.
- **Páginas de gênero** (`/genero/[slug]`): cabeçalho com blurb de uma linha + grade com abas de ordenação (Mais recentes / Mais lidas / Melhor avaliadas), compartilhadas com a home via componente `SeriesGrid`.
- **Painel do autor**: gráfico de leituras por dia (14 dias) em barras amarelas sobre painel (valores em mono) + contadores; abas de ordenação seguem o mesmo token de chip ativo.
- **Pré-visualização**: banner discreto "Prévia do autor" (borda amarela em fundo amarelo 12%) quando o admin lê um capítulo rascunho via `?preview=1`.
- **Comunidade**: nome do autor de comentário vira link para o perfil público (`/leitores/[id]`); o autor do estúdio ganha badge "autor" (amarelo, discreto) ao lado do nome.
- **Central da comunidade** (`/comunidade`): hero editorial assimétrico, descoberta de pessoas e feed de conversas. A tela evita ranking; contadores existem para dar contexto, não para produzir competição.
- **Ações sociais**: curtir, responder, seguir e compartilhar usam controles compactos com ícones de traço; respostas ficam visualmente aninhadas em um único nível e o comentário fixado recebe tratamento editorial discreto.
- **Notificações** (`/notificacoes`): agrupamento cronológico legível, estado lido/não lido, ações de marcar uma ou todas e links diretos ao contexto.
- **Moderação**: leitores autenticados denunciam em um formulário inline discreto; o painel mostra denúncias abertas primeiro e permite ocultar/restaurar sem apagar o histórico.
- **Perfis públicos**: mesma linguagem do perfil próprio (avatar, badges) com favoritas + comentários recentes, sem dados privados.
- **SEO**: `og:image` com a capa por obra/capítulo, JSON-LD `ComicSeries`/`ComicIssue`, `sitemap.xml`, `robots.txt` e feed `rss.xml`.
- **Imagens**: conversão automática para WebP (q. 82) no upload e entrega Cloudinary responsiva (`f_auto`, `q_auto`, `srcset`) — capas e páginas ficam mais leves sem mudar de moldura.

### Don't:
- **Don't** usar gradiente em texto; ênfase vem de peso ou escala do Anton.
- **Don't** adicionar textura, molduras duplas, divisórias de velocidade ou carimbos — o design é de plataforma moderna, não de quadrinho.
- **Don't** deixar a página esparsa: densidade de conteúdo é a beleza.
- **Don't** fazer o site parecer template: é uma plataforma de manga — escura, densa e tátil.
