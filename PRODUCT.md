# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 + React 19 (App Router, TypeScript), estrutura modular em `src/` (features, db, components/ui). Banco **Postgres** gerenciado (Neon) via **Drizzle ORM** com migrações versionadas (`drizzle/`). Autenticação com **Better Auth** (email + senha, sessões, papéis `user`/`admin`). Imagens usam Cloudinary em produção, com suporte a storage compatível com S3/R2 e fallback local apenas em desenvolvimento.

## Users

- **Autor (administrador):** publica e gerencia as obras. Cria mangas com ferramentas de IA e quer publicá-los com o mínimo de fricção. É identificado por email (`ADMIN_EMAIL`) — ao se cadastrar com esse email, vira admin automaticamente.
- **Leitores (com conta):** criam conta com email e senha, navegam o catálogo, leem capítulos, comentam, reagem, seguem outros leitores, favoritam obras e sincronizam progresso de leitura entre dispositivos.

## Product Purpose

Webapp completo de publicação e comunidade de mangás: um painel que torna postar capítulos rápido (upload de páginas ou URLs), uma experiência de leitura imersiva e uma camada social que transforma cada capítulo em conversa. Sucesso = o autor publica em minutos e o leitor lê com conforto, volta quando há novidades e encontra pessoas com gostos próximos.

## Positioning

Publicação de mangas autogerida com cara de tankōbon: dark, moderna e modular. O autor controla os dados (Postgres próprio), a autenticação é padrão de mercado (Better Auth) e a estrutura de código é 100% modular por feature.

## Operating Context

O autor entra no painel administrativo protegido por papéis (Better Auth), cadastra séries (título, capa, sinopse, gêneros e status), cria capítulos e adiciona páginas por upload de arquivo ou URL. Leitores criam conta, navegam pela home, catálogo e gêneros, leem em tela cheia por clique/teclado/swipe e participam de conversas nas obras e capítulos. Progresso, favoritas e preferências ficam sincronizados na conta, com fallback local de leitura para visitantes.

## Capabilities and Constraints

- Autenticação completa com Better Auth: cadastro, login, logout, sessões com cookie, papel `admin` concedido pelo email em `ADMIN_EMAIL`.
- CRUD de séries, capítulos e páginas (server actions com validação Zod); páginas por upload de arquivo ou URL.
- Catálogo público com busca, rotas canônicas de gênero, ordenação, página da obra e leitor full-screen nos modos rolagem, página e dupla, com teclado, clique, touch, zoom e restauração de posição.
- "Continuar lendo", favoritas e contagem de capítulos não lidos sincronizados na conta, com fallback local para visitantes.
- Comunidade pública com descoberta de perfis, biografia, gênero favorito, seguidores e atividade recente.
- Conversas por obra e capítulo com respostas em dois níveis, curtidas, compartilhamento nativo/copiado e comentário fixado pelo autor.
- Notificações internas para novos capítulos das obras favoritas, respostas, curtidas, seguidores e destaques; email continua opcional e só será ativado quando domínio/Resend existirem.
- Denúncias com fila de moderação, ocultação preventiva e restauração pelo autor.
- Painel admin com métricas editoriais, tráfego, atividade da comunidade, moderação e prontidão de publicação.
- Operação de produção com Cloudinary, imagens responsivas, health check, logs estruturados, CI e backup criptografado diário.
- Idioma do site: português (idioma do usuário).
- O usuário não quer destacar que as obras são geradas por IA; o site não deve apresentar isso no copy público.
- Sem material real de mangas ainda: conteúdo de demonstração é sintético e rotulado como tal.

## Brand Commitments

Marca de produto: **Meu Mangá**, com símbolo amarelo e wordmark condensado. Voz: português, direta, editorial e acolhedora. Constraint explícita: não divulgar "feito por IA" no copy público.

## Evidence on Hand

Há conteúdo de demonstração publicado e as obras definitivas estão em desenvolvimento pelo autor. Trabalhos futuros não devem substituir os mangás, nem inventar claims comerciais, preços, métricas ou parcerias.

## Product Principles

1. **Postar é rápido.** O fluxo do autor reduz fricção ao mínimo: páginas entram por arquivo ou URL, capítulos publicam em segundos.
2. **A leitura é imersiva.** A arte lidera; a interface desaparece durante a leitura.
3. **Contas a serviço da leitura.** Login existe para sincronizar favoritas e progresso e para comentar — nada de paywall ou fricção.
4. **Dados e código do autor.** Postgres próprio + estrutura modular; sem lock-in de terceiros no código ou nos dados.
5. **Leitura mobile-first.** A maioria dos leitores estará no celular.
6. **Comunidade sem ruído.** Relações e reações ajudam a conversa; pessoas não são ranqueadas. O ranking pertence às obras e usa leituras e avaliações reais, sem mecânica agressiva de engajamento.

## Accessibility & Inclusion

Manter contraste adequado, foco visível e textos alternativos para capas e páginas. Sem requisito de padrão específico estabelecido.
