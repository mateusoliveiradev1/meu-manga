# Meu Mangá

Plataforma completa para publicar e ler mangás, construída com Next.js 16, React 19, Postgres/Neon, Drizzle ORM e Better Auth.

## Recursos

Para leitores:

- Catálogo paginado, busca com sugestões, gêneros, favoritos, avaliações e perfis públicos.
- Leitor mobile-first nos modos rolagem, página e dupla.
- Progresso sincronizado para contas e fallback local para visitantes.
- Comentários editáveis por obra e capítulo, com proteção de spoilers e denúncia de spam ou abuso.
- PWA instalável com modo offline, RSS, sitemap, Open Graph e dados estruturados.
- Troca de senha, encerramento de outras sessões e exclusão segura da conta.

Para o autor:

- Painel protegido por papel de administrador.
- CRUD de obras, capítulos e páginas; upload, URLs, importação ZIP/CBZ e duplicação de capítulos.
- Rascunhos com salvamento local, pré-visualização e publicação agendada.
- Reordenação de páginas por arrastar, setas acessíveis e limpeza em lote.
- Leituras por dia, páginas mais acessadas, leitores ativos, conclusões e prontidão editorial.
- Fila de moderação com ocultação e restauração de comentários.

Operação:

- Imagens convertidas para WebP no upload e entregues pelo Cloudinary com `f_auto`, `q_auto` e `srcset` responsivo.
- Rate limiting persistente no Postgres para Better Auth, comentários, denúncias, uploads e contadores.
- Health check em `/api/health`, logs JSON, captura global de erros, Vercel Analytics e Speed Insights.
- Backup diário criptografado, armazenado como recurso autenticado no Cloudinary.
- CI no GitHub com migrações, typecheck, build, auditoria desktop/mobile e E2E.

## Desenvolvimento

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run dev
```

O site estará em `http://localhost:3000`.

## Variáveis de ambiente

Obrigatórias em produção:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão Postgres/Neon |
| `BETTER_AUTH_SECRET` | Assinatura das sessões |
| `BETTER_AUTH_URL` | URL pública do site |
| `SITE_URL` | Canonical, sitemap, RSS e compartilhamento |
| `SITE_NAME` | Nome exibido no produto |
| `ADMIN_EMAIL` | Um ou mais administradores, separados por vírgula |
| `CLOUDINARY_CLOUD_NAME` | Cloud usado para imagens e backups |
| `CLOUDINARY_API_KEY` | Credencial do Cloudinary |
| `CLOUDINARY_API_SECRET` | Segredo do Cloudinary |
| `CRON_SECRET` | Proteção dos endpoints `/api/cron/backup` e `/api/cron/publish` |
| `BACKUP_ENCRYPTION_KEY` | Criptografia AES-256-GCM dos backups |

Consulte [.env.example](./.env.example) para R2, suporte e recursos opcionais. Resend permanece opcional e não é necessário para o funcionamento atual.

## Banco e migrações

```bash
npm run db:migrate
npx drizzle-kit generate
npx tsx --env-file=.env src/db/seed.ts
```

As migrações versionadas vivem em `drizzle/` e também são aplicadas pelo `vercel-build`.

## Backups

O Cron da Vercel chama `/api/cron/backup` diariamente às 03:00 UTC. O snapshot:

- inclui contas, obras, capítulos, páginas, comentários, denúncias, avaliações, favoritos, progresso e métricas;
- exclui sessões, tokens de verificação e buckets de rate limit;
- é compactado, criptografado com AES-256-GCM e enviado como recurso `authenticated` para o Cloudinary;
- remove automaticamente arquivos com mais de 30 dias.

Uma segunda execução diária chama `/api/cron/publish` às 03:05 UTC para garantir capítulos agendados. As consultas públicas também verificam publicações vencidas, reduzindo o atraso quando há tráfego.

Backup local e validação:

```bash
npm run backup
npm run backup:verify -- backups/backup-<data>.mangabackup
npm run backup:restore -- backups/backup-<data>.mangabackup
```

Para enviar referências antigas de `/api/files/*` ao storage remoto configurado e atualizar o banco:

```bash
npm run images:migrate
```

O último comando valida sem alterar dados. A restauração real só é permitida em banco vazio e exige confirmação explícita:

```bash
npm run backup:restore -- backups/backup-<data>.mangabackup --apply --confirm=RESTORE_EMPTY_DATABASE
```

## Verificação

```bash
npm run typecheck
npm run build
npm run test:audit
npm run test:e2e
```

A workflow em `.github/workflows/ci.yml` executa o fluxo completo com um Postgres descartável a cada push e pull request.

## Armazenamento

Prioridade de imagens: Cloudinary → R2 → disco local. O modo local serve apenas para desenvolvimento ou servidores persistentes; na Vercel use Cloudinary ou R2.

Uploads são validados por tamanho e magic bytes, corrigidos pela orientação EXIF e convertidos para WebP. URLs do Cloudinary recebem transformações de entrega apenas no navegador, mantendo as URLs canônicas salvas no banco.

## Segurança

- Better Auth com cookies seguros, papéis e rate limiting em banco.
- Server Actions verificam autorização no próprio servidor.
- Upload exclusivo para administrador e limitado por conta.
- Denúncias limitadas por conta/IP; três denúncias abertas ocultam preventivamente um comentário até revisão.
- Headers contra MIME sniffing, framing e permissões desnecessárias.
- Segredos ficam somente no ambiente e arquivos `.env*` são ignorados pelo Git.
