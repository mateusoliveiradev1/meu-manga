# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 + React 19 (App Router, TypeScript), estrutura modular em `src/` (features, db, components/ui). Banco **Postgres** gerenciado (Neon) via **Drizzle ORM** com migrações versionadas (`drizzle/`). Autenticação com **Better Auth** (email + senha, sessões, papéis `user`/`admin`). Uploads salvos no filesystem do servidor (`public/uploads/`).

## Users

- **Autor (administrador):** publica e gerencia as obras. Cria mangas com ferramentas de IA e quer publicá-los com o mínimo de fricção. É identificado por email (`ADMIN_EMAIL`) — ao se cadastrar com esse email, vira admin automaticamente.
- **Leitores (com conta):** criam conta com email e senha, navegam o catálogo, leem capítulos, comentam, favoritam obras e sincronizam progresso de leitura entre dispositivos.

## Product Purpose

Webapp completo de publicação de mangas: um painel de publicação que torna postar capítulos rápido (upload de páginas ou colar URLs), e uma experiência de leitura imersiva para o público. Sucesso = o autor posta um capítulo em minutos e o leitor lê com conforto em qualquer dispositivo, com sua conta acompanhando favoritas e progresso.

## Positioning

Publicação de mangas autogerida com cara de tankōbon: dark, moderna e modular. O autor controla os dados (Postgres próprio), a autenticação é padrão de mercado (Better Auth) e a estrutura de código é 100% modular por feature.

## Operating Context

O autor gera páginas com IA, entra no painel administrativo protegido por papéis (Better Auth), cadastra séries (título, capa, sinopse, tags, status), cria capítulos e adiciona páginas por upload de arquivo ou URL de imagem. Leitores criam conta, navegam a home (catálogo), página da obra, e leem no leitor em tela cheia com navegação por clique/teclado/swipe. Progresso de leitura e favoritos ficam sincronizados na conta (com fallback em localStorage para visitantes anônimos). Comentários por capítulo exigem login.

## Capabilities and Constraints

- Autenticação completa com Better Auth: cadastro, login, logout, sessões com cookie, papel `admin` concedido pelo email em `ADMIN_EMAIL`.
- CRUD de séries, capítulos e páginas (server actions com validação Zod); páginas por upload de arquivo ou URL.
- Catálogo público (grade de capas, status, contagem de leituras), página de detalhes da obra, leitor full-screen com dois modos (página e rolagem) e navegação por teclado, clique e touch.
- "Continuar lendo" e favoritos: sincronizados na conta (server) com fallback local para anônimos.
- Comentários por capítulo, com autorização para apagar (dono ou admin).
- Painel admin com dashboards de contadores (obras, capítulos, páginas, comentários, leituras).
- Idioma do site: português (idioma do usuário).
- O usuário não quer destacar que as obras são geradas por IA; o site não deve apresentar isso no copy público.
- Sem material real de mangas ainda: conteúdo de demonstração é sintético e rotulado como tal.

## Brand Commitments

Sem nome de marca, logotipo ou assets confirmados. Voz: português. Constraint explícita: não divulgar "feito por IA" no copy público.

## Evidence on Hand

Nenhum conteúdo real (capas, páginas, textos) existe ainda. Trabalhos futuros não devem inventar claims comerciais (preços, métricas, parcerias).

## Product Principles

1. **Postar é rápido.** O fluxo do autor reduz fricção ao mínimo: páginas entram por arquivo ou URL, capítulos publicam em segundos.
2. **A leitura é imersiva.** A arte lidera; a interface desaparece durante a leitura.
3. **Contas a serviço da leitura.** Login existe para sincronizar favoritas e progresso e para comentar — nada de paywall ou fricção.
4. **Dados e código do autor.** Postgres próprio + estrutura modular; sem lock-in de terceiros no código ou nos dados.
5. **Leitura mobile-first.** A maioria dos leitores estará no celular.

## Accessibility & Inclusion

Manter contraste adequado, foco visível e textos alternativos para capas e páginas. Sem requisito de padrão específico estabelecido.
