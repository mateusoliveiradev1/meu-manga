# Tinta e Papel — seu site de mangas

Um webapp completo para publicar e ler mangas, com visual **dark de tankōbon** ("Tinta e Papel"): chão tinta-preta com meio-tom, painéis de dupla moldura, um amarelo shonen como voz ativa, display Anton e números JetBrains Mono. Feito com **Next.js 16 + React 19 (App Router, TypeScript)**, **Postgres (Neon)** via **Drizzle ORM** e **Better Auth** (contas de leitor + admin).

## O que ele faz

**Para os leitores (com conta ou anônimos):**
- **Contas** com email e senha (Better Auth): cadastro, login, sessões seguras.
- Catálogo na home, com cada obra como um volume (capa, faixa obi de status, contagem de leituras) e **busca no header** (`?q=`) + **filtro por gêneros** (barra na home e dropdown no header).
- Página da obra com lista de capítulos e botão "Ler do início".
- Leitor full-screen com **três modos**: **rolagem** (padrão, estilo webtoon), **página** (zonas de clique, setas do teclado) e **dupla** (duas páginas lado a lado no desktop). Páginas duplas (imagem larga) são detectadas sozinhas e divididas ao meio no toque.
- **Página Sobre** (`/sobre`) com a história do estúdio e perguntas frequentes.
- **Continuar lendo**: progresso sincronizado na conta (com fallback em localStorage para anônimos); a página da obra mostra "Você estava em…".
- **Favoritos**: estrela na página da obra, sincronizados na conta; faixa "Suas favoritas" na home.
- **Perfil** (`/perfil`): nome no topo leva ao seu perfil — identidade, continuar lendo, favoritas e seus comentários.
- **Comentários**: por capítulo **e por obra**, com autorização para apagar (dono ou admin).
- **Rating em estrelas** (1–5): leitores logados avaliam a obra; a página mostra a média e a contagem.

**Para você (o autor):**
- Painel em `/admin` protegido por papel (só quem se cadastra com o email de `ADMIN_EMAIL` vira admin).
- Dashboard com contadores (obras, capítulos, páginas, comentários, leituras).
- Cadastro de obras (título, sinopse, capa por upload **ou** URL, status, **gêneros em chips** + tags livres).
- Capítulos com **capa própria**, **páginas por upload de arquivos** (múltiplos de uma vez) **ou colando URLs** (uma por linha), com reordenação por setas e numeração preservada no upload múltiplo.
- Rascunhos: um capítulo só aparece para os leitores quando você publica.

## Começando

```bash
npm install
cp .env.example .env   # preencha as variáveis (ver abaixo)
npm run dev            # http://localhost:3000
```

### Variáveis de ambiente (`.env`)

| Variável | O que faz |
| --- | --- |
| `DATABASE_URL` | String de conexão do Postgres (ex.: Neon). Ex.: `postgresql://user:pass@host/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | Segredo que assina as sessões do Better Auth (gere um longo e aleatório) |
| `BETTER_AUTH_URL` | URL base do site (ex.: `http://localhost:3000`) |
| `ADMIN_EMAIL` | Email(s) que, ao se cadastrar (ou logar), viram administrador automaticamente. Aceita vários separados por vírgula |
| `SITE_NAME` | Nome do site no topo e no rodapé |

### Banco de dados (Postgres)

As tabelas são criadas por migração versionada (Drizzle). Depois de configurar o `DATABASE_URL`:

```bash
npx drizzle-kit generate   # gera a migração a partir do schema (já versionado em drizzle/)
npx drizzle-kit migrate    # aplica no banco
npx tsx --env-file=.env src/db/seed.ts   # (opcional) popula com a obra de amostra
```

> Sem Docker/Postgres local? O [Neon](https://neon.tech) dá um Postgres serverless com free tier — a Gravity Index recomendou justamente ele para este stack. A string do Neon funciona direto no `DATABASE_URL`.

### Primeiro acesso

1. Abra `http://localhost:3000` — com o seed, aparece a obra de amostra ("O Farol Entre Mundos") com capítulos, páginas e comentários.
2. Cadastre-se com o email de `ADMIN_EMAIL` → você vira admin na hora e o link "Painel" aparece no topo.
3. Entre em `/admin` e explore o fluxo: edite ou apague a obra de amostra e crie as suas.

## Como usar no dia a dia

1. **Nova obra** → Painel → "Nova obra" (capa: envie um arquivo, arraste, cole Ctrl+V ou use uma URL).
2. **Capítulo** → na obra, "Novo capítulo" → opcionalmente dê uma **capa ao capítulo** (arquivo, arraste, cole ou URL; aparece como miniatura na lista da obra e do painel) → adicione páginas:
   - *Upload*: selecione vários arquivos de imagem de uma vez; entram na **ordem da numeração dos nomes** (ordenação natural — `página 2` antes de `página 10`).
   - *URLs*: cole uma URL por linha (o gerador de imagens costuma fornecer links diretos).
   - Use as setas para reordenar e o botão vermelho para apagar.
3. **Publicar** → marque "Publicar agora" (rascunhos ficam invisíveis para leitores).
4. Acompanhe leituras no painel e na página da obra: cada abertura de capítulo conta uma leitura (uma por sessão), e a lista mostra leituras + comentários por capítulo.
5. Na página da obra, leitores logados podem **avaliar com estrelas** (1–5) e **comentar a obra** — além dos comentários por capítulo.

## Estrutura (100% modular)

```
src/
  app/                    # rotas (App Router)
    (public)/             #   home, obra, leitor, entrar/cadastro, admin
    api/auth/[...all]     #   handler do Better Auth
    api/upload/           #   upload de imagens
    api/read/             #   contador de leituras (incremento atômico por capítulo)
    api/files/[name]/     #   serve os uploads (fora de public/)
  components/             # componentes por domínio
    ui/                   #   primitivos (icons, bits, counter)
    auth/ admin/ reader/ favorites/
  db/                     # schema Drizzle + client + seed
  features/               # lógica por feature (separada das rotas)
    auth/ catalog/ comments/ favorites/ reader/
  lib/                    # utils e validação (Zod)
uploads/                  # imagens enviadas pelo painel (gitignored; servidas via /api/files)
public/samples/           # conteúdo sintético de amostra (gerado pelo seed)
drizzle/                  # migrações versionadas
.agents/skills/impeccable/ # skill de design (PRODUCT.md, DESIGN.md, briefs)
```

## Recursos de crescimento

- **SEO**: metadata OpenGraph/Twitter por obra e capítulo, JSON-LD (Schema.org `ComicSeries`/`ComicIssue`), `sitemap.xml`, `robots.txt` e `rss.xml` (feed dos capítulos).
- **Descoberta**: páginas `/genero/[slug]` com descrição + grade ordenável (mais recentes, mais lidas, melhor avaliadas).
- **Publicação agendada**: campo "Agendar publicação" no capítulo — o site publica sozinho na hora marcada (sem cron: o publish roda sob demanda) e **notifica por email** (Resend) os leitores que favoritaram a obra; cada leitor gerencia isso no perfil.
- **Pré-visualização**: botão "Pré-visualizar" no editor abre o capítulo não publicado só para você.
- **Estatísticas**: gráfico de leituras por dia (14 dias) no painel (tabela `reading_stats`).
- **PWA**: manifest + service worker — o site pode ser instalado e as páginas lidas ficam disponíveis offline.
- **Imagens otimizadas**: PNG/JPG/GIF viram **WebP** (q. 82) no upload via sharp — páginas mais leves no tráfego.
- **Comunidade**: perfil público de leitores (`/leitores/[id]`), badge "autor" nos comentários do estúdio e obras relacionadas por gênero.
- **Importação ZIP/CBZ**: no editor do capítulo, envie um `.zip`/`.cbz` com as páginas e elas entram em ordem.
- **Apoio**: `SUPPORT_URL` (Pix/Ko-fi) aparece no fim dos capítulos e no rodapé.

## Scripts de verificação

- `scripts/e2e.mjs` — fluxo de ponta a ponta com Playwright (cadastro/login → admin → obra → capítulo → páginas → publicar → comentar → favoritar → progresso). Rode com `ADMIN_TEST=1` para exercitar o fluxo de admin.
- `scripts/cleanup-e2e.mjs` — remove os dados de teste criados pelo E2E.
- `scripts/screenshot.mjs` + `scripts/validate-shots.mjs` + `scripts/audit.mjs` — capturam e auditam a UI (desktop/mobile): h1s, overflow, imagens quebradas.

```bash
npm run build && npm start   # servidor em produção
node scripts/audit.mjs       # auditoria visual
```

## Notas

- **Conteúdo de amostra é sintético.** As páginas SVG de exemplo foram geradas para demonstração; apague a obra de amostra pelo painel e publique as suas.
- **Dados**: tudo no Postgres (Neon). As imagens enviadas ficam em `uploads/` (fora de `public/`) e são servidas pela rota `/api/files/[nome]` — inclua essa pasta nos backups. A rota valida o nome do arquivo (só UUIDs), e o `/api/upload` confere os *magic bytes* reais da imagem (o MIME do cliente é ignorado), então HTML disfarçado de imagem não passa.
- **Segredos**: tudo que é sensível vive no `.env` (gitignored). O servidor recusa boot em produção se `BETTER_AUTH_SECRET` estiver ausente ou for o placeholder — gere um com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Nenhuma variável é exposta ao cliente (não há `NEXT_PUBLIC_*`).
- **Deploy**: Next.js em qualquer host Node (Vercel, Railway, Render, VPS). O Postgres pode ser Neon, Supabase ou qualquer Postgres com a string no `DATABASE_URL`; troque `BETTER_AUTH_URL` pela URL final e gere um `BETTER_AUTH_SECRET` novo.

### Armazenamento de imagens (local → Cloudinary ou R2 no deploy)

As imagens (capas e páginas) passam por uma camada única em `src/lib/storage.ts`, com três modos (prioridade: **Cloudinary → R2 → disco local**):

- **Sem configuração** (dev/VPS): grava em `uploads/` (fora de `public/`) e serve por `/api/files/[nome]` — funciona hoje, sem mudança.
- **Com Cloudinary**: defina as três variáveis abaixo e o upload passa a ir para o seu cloud, servido por CDN com otimização automática — nada no banco muda. O free plan dá 25 créditos/mês (1 crédito = 1 GB de storage **ou** 1 GB de bandwidth **ou** 1.000 transformações; o armazenamento é cobrado todo mês, então o free aguenta um acervo pequeno). O `/api/files` continua funcionando (redireciona para o Cloudinary) para capas antigas que apontavam para ele.
- **Com Cloudflare R2** (melhor custo em escala, para Vercel/Railway ou qualquer host efêmero): defina as variáveis abaixo e o upload passa a gravar no bucket, devolvendo a URL pública do R2. Em R2 não há custo de saída (egress grátis), ideal para um site onde cada leitura baixa dezenas de imagens. O `/api/files` continua funcionando (redireciona para o R2) para capas antigas que apontavam para ele.

```env
# Cloudinary (dashboard → Settings → Access Keys)
CLOUDINARY_CLOUD_NAME=seu-cloud
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Cloudflare R2 (S3-compatível)
R2_BUCKET_NAME=mangas
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

Qualquer bucket compatível com S3 serve para o R2 (AWS S3, Backblaze B2, etc.) — é só apontar `R2_ENDPOINT` para ele. A troca é transparente para o banco: as URLs salvas apontam sempre para onde a imagem está.
- **Segurança**: Better Auth gerencia senhas (hash, sessões com cookie httpOnly, sameSite lax) e papéis. O papel `admin` só é concedido ao email de `ADMIN_EMAIL`.

### Backup

O banco é Postgres (Neon). O Neon tem **snapshots automáticos** (point-in-time recovery) — confira em Console → Branches → seu branch → Backups/History. Para um backup exportável fora da plataforma, use o script pronto:

```bash
npm run backup               # dump JSON completo -> backups/backup-<data>.json
npm run backup -- --keep 7   # também apaga backups com mais de 7 dias
```

O dump cobre todas as tabelas do app (obras, capítulos, páginas, comentários, ratings, favoritas, progresso, leituras e pageviews) e funciona sem `pg_dump` nem acesso ao host do Neon. Para restaurar, o JSON é o formato canônico — inclua também `uploads/` (ou o bucket R2 / a Media Library do Cloudinary) no backup, pois as imagens ficam fora do banco.

Agende no cron (VPS) ou num GitHub Action diário:

```bash
# exemplo de cron diário às 4h
0 4 * * * cd /caminho/do/projeto && npm run backup -- --keep 14 >> /var/log/manga-backup.log 2>&1
```

### Rate limiting

O site tem rate limiting nas duas portas de entrada para spam e brute force:

- **Login/cadastro** (Better Auth, por IP): `sign-in` 5 tentativas/min, `sign-up` 10 contas/h, reset de senha e verificação 5/h, base de 30 req/min — configurado em `src/features/auth/server.ts` (`rateLimit`). O IP é lido de `x-forwarded-for`/`x-real-ip`/`cf-connecting-ip` (ajuste `advanced.ipAddress.ipAddressHeaders` para o seu proxy).
- **Comentários** (próprio, em `src/lib/rate-limit.ts`, por usuário e por IP): 5 comentários/min, 30/h por conta, 60/h por IP — janela deslizante atômica sobre Postgres (tabela `rate_limits`), então funciona em várias instâncias e sobrevive a restart.

> Nota: o rate limit de login usa o storage em memória do Better Auth (uma instância). Se escalar para várias instâncias, configure `rateLimit.customStorage`/`secondaryStorage` compartilhado. Os limites são constantes no código — ajuste-os por ali.

## Design

O visual ("Tinta e Papel" — tankōbon dark) foi criado com a skill [impeccable](https://github.com/pbakaus/impeccable). O sistema está documentado em `DESIGN.md`, os fatos do produto em `PRODUCT.md`, e as decisões por superfície em `.impeccable/surfaces/`.
