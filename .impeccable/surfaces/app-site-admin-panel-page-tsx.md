---
version: 1
slug: "app-site-admin-panel-page-tsx"
primary_target: "src/app/(public)/admin/page.tsx"
related_targets: ["src/app/(public)/admin/layout.tsx", "src/app/(public)/admin/obras/novo/page.tsx", "src/app/(public)/admin/obras/[id]/capitulos/page.tsx", "src/app/(public)/admin/capitulos/[id]/editar/page.tsx"]
---

# Painel — o registro do estúdio

**Scope:** `/admin` e sub-rotas (dashboard, obras, capítulos, editor de páginas).
**Visitor mode:** Operate — o autor trabalhando; legível e escaneável, no mesmo mundo.

**Audience:** apenas o autor (papel `admin` via Better Auth, concedido pelo email em `ADMIN_EMAIL`).

**Job / action:** criar e gerir obras/capítulos/páginas sem fricção. Dashboard com contadores mono (obras, capítulos, páginas, recados, leituras); tabelas com ações por linha; formulários com validação; editor de páginas com upload múltiplo **ou** URLs coladas (uma por linha) e reordenação por setas.

**Proof / content:** tabelas admin com números JetBrains Mono e badges de status; o mesmo chão tinta-preta, painéis de dupla moldura e botões amarelos — o mundo do site, no registro de operação.

**Constraints:** acesso protegido por papel admin (redirect para `/entrar` se não autenticado, para `/` se não-admin); capítulos em rascunho invisíveis aos leitores até publicar; páginas limitadas a 200 por capítulo; ações destrutivas sempre com confirmação.

**Chosen direction:** Tinta e Papel (tankōbon dark) — o painel é o "registro do estúdio": o mesmo vocabulário de moldura e amarelo, com tabelas e contadores que lembram os dados de orelha de um volume.

**Memorable moment:** publicar um capítulo e ver os contadores do dashboard subirem — o autor sente o estúdio vivo.
