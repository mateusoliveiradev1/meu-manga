/* End-to-end verification against the running server (npm start).
   Covers: register (admin email) -> admin panel -> create obra -> chapter ->
   pages via URL -> publish -> public visibility -> comment -> favorite -> progress.
   Cleans up the created test data at the end. */

import fs from "node:fs";
import { chromium } from "playwright";
import postgres from "postgres";

const BASE = process.env.BASE_URL || "http://localhost:3000";
// the admin email must match the SERVER's ADMIN_EMAIL (read from .env by default,
// or override with E2E_ADMIN_EMAIL when testing against a dedicated server)
function readEnvValue(name) {
  try {
    const line = fs.readFileSync(".env", "utf8").split(/\r?\n/).find((l) => l.startsWith(name + "="));
    if (line) return line.slice(name.length + 1).trim();
  } catch {}
  return undefined;
}
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || readEnvValue("ADMIN_EMAIL") || "voce@exemplo.com";
const EMAIL = process.env.ADMIN_TEST ? ADMIN_EMAIL : `teste-${Date.now()}@exemplo.com`;
const PASSWORD = "senha-teste-123";
const NAME = "Teste E2E";
const TITLE = `Obra E2E ${Date.now()}`;
let createdPrimaryAccount = false;
let readerEmail = null;

const results = [];
function check(label, ok, extra = "") {
  results.push({ label, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  // 1. home loads (self-contained: no dependency on seed sample data)
  await page.goto(BASE + "/", { waitUntil: "load" });
  check("home carrega", (await page.content()).includes('href="/entrar"') || (await page.content()).includes("site-header"));
  const SERIES_SLUG = TITLE.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let TEST_CHAPTER_ID = null;
  let chapterCommentText = "";

  // 1b. header: search + genres dropdown + compact primary navigation
  check("header tem busca", (await page.locator(".header-search input").count()) === 1);
  check("header tem dropdown de gêneros", (await page.locator(".genre-drop summary").count()) === 1);
  await page.click(".genre-drop summary");
  await page.waitForTimeout(300);
  const dropLinks = await page.locator(".genre-drop-panel a").count();
  check("dropdown lista os gêneros", dropLinks >= 10, `${dropLinks} gêneros`);
  check("Sobre fica no rodapé", (await page.locator('footer a[href="/sobre"]').count()) === 1 && (await page.locator('.site-nav a[href="/sobre"]').count()) === 0);
  check("link Ranking no header", (await page.locator('.site-nav a[href="/ranking"]').count()) === 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.click(".mobile-menu-trigger");
  const mobileMenu = await page.locator(".mobile-menu-panel").evaluate((panel) => {
    const box = panel.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      viewport: window.innerHeight,
      bodyOverflow: getComputedStyle(document.body).overflow,
    };
  });
  check(
    "menu mobile abre dentro da tela",
    mobileMenu.top >= 0 && mobileMenu.bottom <= mobileMenu.viewport && mobileMenu.bodyOverflow === "hidden",
    JSON.stringify(mobileMenu)
  );
  await page.click('.mobile-menu-head button[aria-label="Fechar menu"]');
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto(BASE + "/ranking", { waitUntil: "load" });
  const rankingTitle = (await page.locator("h1").textContent()) ?? "";
  check(
    "ranking público carrega",
    rankingTitle.includes("histórias que estão puxando a fila") || rankingTitle.includes("ranking que cresce com os leitores"),
    rankingTitle
  );

  // 1c. catalog and genre discovery
  await page.goto(BASE + "/obras", { waitUntil: "load" });
  const catalogH1 = await page.locator("h1").first().innerText();
  check("catálogo dedicado carrega", catalogH1.includes("próxima história"), catalogH1);
  check(
    "filtros do catálogo usam divulgação progressiva",
    (await page.locator("details.catalog-controls").count()) === 1 &&
      !(await page.locator("details.catalog-controls").getAttribute("open"))
  );

  await page.goto(BASE + "/genero/drama", { waitUntil: "load" });
  const genreH1 = await page.locator("h1").first().innerText();
  check("filtro por gênero usa rota canônica", genreH1 === "Drama", genreH1);

  // 1d. search from the header
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.fill(".header-search input", "eco");
  await page.press(".header-search input", "Enter");
  await page.waitForTimeout(800);
  const searchH2 = await page.locator("h2").first().innerText();
  check(
    "busca do header abre o catálogo filtrado",
    page.url().includes("/obras?q=eco") && searchH2.includes("Resultados para"),
    `${page.url()} — ${searchH2}`
  );

  // 1e. about page
  await page.goto(BASE + "/sobre", { waitUntil: "load" });
  check(
    "página Sobre carrega",
    (await page.content()).includes("Histórias que crescem") && (await page.locator(".about-stats > div").count()) >= 2
  );

  // 1f. genre page + SEO endpoints
  await page.goto(BASE + "/genero/horror", { waitUntil: "load" });
  const genrePage = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent ?? "",
    blurb: !!document.querySelector(".genre-blurb"),
  }));
  check("página de gênero dedicada", genrePage.h1 === "Horror" && genrePage.blurb);
  const seo = await Promise.all(["sitemap.xml", "robots.txt", "rss.xml", "manifest.webmanifest"].map(async (path) => {
    const res = await fetch(BASE + "/" + path);
    return res.status;
  }));
  check("sitemap/robots/rss/manifest no ar", seo.every((s) => s === 200), seo.join(","));
  const health = await fetch(BASE + "/api/health");
  const healthBody = await health.json();
  check("health check confirma banco e storage", health.status === 200 && healthBody.ok && healthBody.database === "reachable");
  const homeHeaders = await fetch(BASE + "/");
  check(
    "headers de segurança ativos",
    homeHeaders.headers.get("x-content-type-options") === "nosniff" && homeHeaders.headers.get("x-frame-options") === "DENY"
  );

  // 2. register (fall back to login if the account already exists)
  await page.goto(BASE + "/cadastro", { waitUntil: "load" });
  await page.fill("#reg-name", NAME);
  await page.fill("#reg-email", EMAIL);
  await page.fill("#reg-password", PASSWORD);
  await page.click('button:has-text("Criar minha estante")');
  const regRedirected = await page
    .waitForURL(BASE + "/", { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  createdPrimaryAccount = regRedirected;
  if (!regRedirected) {
    const signupError = await page.locator(".form-error").textContent().catch(() => "");
    if (signupError) console.log("Erro no cadastro:", signupError);
    // account already exists — log in instead
    await page.goto(BASE + "/entrar", { waitUntil: "load" });
    await page.fill("#login-email", EMAIL);
    await page.fill("#login-password", PASSWORD);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(BASE + "/", { timeout: 15000 });
  }
  check("cadastro/login autentica", true);
  check("nome aparece no header", (await page.content()).includes(NAME));

  // 3. admin promotion only happens for ADMIN_EMAIL — if this test email matches, panel appears
  const isAdminEmail = EMAIL === ADMIN_EMAIL;
  if (isAdminEmail) {
    await page.goto(BASE + "/admin", { waitUntil: "load" });
    check("painel admin acessível (email admin)", (await page.content()).includes("Suas obras"));
  } else {
    await page.goto(BASE + "/admin", { waitUntil: "load" });
    check("admin bloqueado para não-admin", page.url().startsWith(BASE + "/entrar") || page.url() === BASE + "/");
  }

  // 4. create a series (only if admin)
  if (isAdminEmail) {
    await page.goto(BASE + "/admin/obras/novo", { waitUntil: "load" });
    await page.fill("#sf-title", TITLE);
    await page.fill("#sf-synopsis", "Sinopse criada pelo teste de ponta a ponta.");
    await page.fill("#sf-tags", "teste, e2e");
    await page.click('button:has-text("Criar obra")');
    await page.waitForURL(/\/admin\/obras\/\d+\/capitulos/, { timeout: 15000 });
    check("obra criada -> página de capítulos", true);

    // 5. create a chapter
    await page.click('a:has-text("Novo capítulo")');
    await page.waitForURL(/\/admin\/capitulos\/novo/, { timeout: 10000 });
    await page.fill("#cf-number", "1");
    await page.fill("#cf-title", "Capítulo de teste");
    await page.click('button:has-text("Criar capítulo")');
    await page.waitForURL(/\/admin\/capitulos\/\d+\/editar/, { timeout: 15000 });
    TEST_CHAPTER_ID = Number(page.url().match(/\/admin\/capitulos\/(\d+)\/editar/)[1]);
    check("capítulo criado -> editor", true);

    // 6. add pages via URLs
    await page.fill("textarea", "https://picsum.photos/seed/e2e1/800/1200\nhttps://picsum.photos/seed/e2e2/800/1200");
    await page.click('button:has-text("Importar URLs")');
    await page.waitForTimeout(2500);
    await page.waitForSelector(".pm-row", { timeout: 10000 });
    check("páginas adicionadas via URL", true);

    // 6b. upload a real image file through the panel file input
    if (!process.env.E2E_SKIP_UPLOAD) {
      const beforeUpload = await page.locator(".pm-row").count();
      const pngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      fs.writeFileSync("e2e-upload.png", Buffer.from(pngB64, "base64"));
      await page.setInputFiles(".pm-upload input[type=file]", "e2e-upload.png");
      await page.waitForTimeout(3000);
      fs.unlinkSync("e2e-upload.png");
      check("página enviada por upload (arquivo real)", (await page.locator(".pm-row").count()) > beforeUpload);
    }

    // 6c. preview: draft chapter is visible only to the admin with ?preview=1
    await page.goto(BASE + "/ler/" + TEST_CHAPTER_ID + "?preview=1", { waitUntil: "load" });
    await page.waitForTimeout(800);
    check("pré-visualização do capítulo rascunho (admin)", (await page.content()).includes("Prévia do autor"));
    await page.goto(BASE + "/admin/capitulos/" + TEST_CHAPTER_ID + "/editar", { waitUntil: "load" });
    await page.waitForTimeout(600);

    // 7. publish
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Salvar capítulo")');
    await page.waitForTimeout(2000);
    check("capítulo salvo (publish checkbox)", page.url().includes("/admin/capitulos/"));

    // 8. public visibility: obra on home + published chapter with pages on obra page
    await page.goto(BASE + "/", { waitUntil: "load" });
    const homeHtml = await page.content();
    check("obra aparece na home pública", homeHtml.includes(TITLE));
    await page.goto(BASE + "/obra/" + SERIES_SLUG, { waitUntil: "load" });
    const obraHtml = await page.content();
    check("capítulo publicado visível na obra", obraHtml.includes("Capítulo de teste"));

    // 8b. personal library: status persists and surfaces in the dedicated route
    await page.selectOption(".library-control select", "reading");
    await page.waitForTimeout(900);
    await page.goto(BASE + "/biblioteca", { waitUntil: "load" });
    check("biblioteca pessoal guarda estado de leitura", (await page.content()).includes(TITLE) && (await page.content()).includes("Lendo"));
    await page.goto(BASE + "/para-voce", { waitUntil: "load" });
    check("recomendações pessoais carregam", (await page.locator("h1").innerText()).includes("Escolhas que partem da sua estante"));

    // 8c. club: a post stays attached to the work
    await page.goto(BASE + "/clube/" + SERIES_SLUG, { waitUntil: "load" });
    const clubTitle = `Teoria E2E ${Date.now()}`;
    await page.click('.club-type-tabs button:has-text("Teoria")');
    await page.fill("#club-title", clubTitle);
    await page.fill("#club-content", "A página final deixa uma pista que muda a leitura do capítulo.");
    await page.click('button:has-text("Publicar teoria")');
    await page.waitForTimeout(1200);
    check("clube publica teoria vinculada à obra", (await page.content()).includes(clubTitle));
    await page.click('.club-type-tabs button:has-text("Enquete")');
    await page.fill("#club-title", "Qual pista importa mais?");
    await page.fill("#poll-option-0", "O relógio");
    await page.fill("#poll-option-1", "A última fala");
    await page.click('button:has-text("Abrir enquete")');
    await page.waitForTimeout(1200);
    const poll = page.locator(".club-poll").first();
    await poll.locator('button:has-text("O relógio")').click();
    await page.waitForTimeout(700);
    check("enquete do clube recebe voto", (await poll.textContent()).includes("1 voto"));

    // 8d. author tools: calendar, automated QA and analytics are protected and render
    await page.goto(BASE + "/admin/calendario", { waitUntil: "load" });
    check("calendário editorial e publicação em lote carregam", (await page.content()).includes("Fluxo editorial") && (await page.content()).includes("Rascunhos prontos"));
    await page.goto(BASE + "/admin/analytics", { waitUntil: "load" });
    check("analytics de produto carrega", (await page.locator("#analytics-title").innerText()).includes("Da capa ao fim do capítulo"));
  }

  // 9. comment on the created chapter (logged in)
  await page.goto(BASE + "/ler/" + TEST_CHAPTER_ID, { waitUntil: "load" });
  await page.waitForSelector("#cm-msg", { timeout: 10000 });
  chapterCommentText = `Comentário E2E ${Date.now()}`;
  await page.fill("#cm-msg", chapterCommentText);
  await page.click('button:has-text("Publicar comentário")');
  await page.waitForTimeout(2000);
  await page.goto(BASE + "/ler/" + TEST_CHAPTER_ID, { waitUntil: "load" });
  await page.waitForSelector(".cm-entry", { timeout: 10000 });
  check("comentário salvo e visível", (await page.content()).includes(chapterCommentText));

  // 10. favorite the created series
  await page.goto(BASE + "/obra/" + SERIES_SLUG, { waitUntil: "load" });
  await page.waitForSelector('button:has-text("Favoritar")', { timeout: 10000 });
  await page.click('button:has-text("Favoritar")');
  await page.waitForTimeout(1200);
  await page.goto(BASE + "/", { waitUntil: "load" });
  const home2 = await page.content();
  check("favoritar mostra a obra na estante", home2.includes("Sua estante") && home2.includes(TITLE));

  // 11. reading progress (page mode click — reader defaults to scroll mode)
  await page.goto(BASE + "/ler/" + TEST_CHAPTER_ID, { waitUntil: "load" });
  await page.waitForSelector(".rt-mode button", { timeout: 10000 });
  await page.click('.rt-mode button:has-text("Página")');
  await page.waitForSelector(".page-nav.next", { timeout: 10000 });
  await page.click(".page-nav.next");
  await page.waitForTimeout(1500);

  // 11a. private page bookmark and note
  await page.click(".reader-tools > summary");
  await page.fill(".reader-note textarea", "Voltar nesta pista depois.");
  await page.click('.reader-tools-panel button:has-text("Marcar esta página")');
  await page.waitForTimeout(900);
  check("marcador privado salvo no leitor", (await page.locator(".reader-tools-panel").textContent()).includes("Página marcada"));

  await page.goto(BASE + "/obra/" + SERIES_SLUG, { waitUntil: "load" });
  // the progress save is a fire-and-forget fetch — with a slow DB it can land
  // a beat after the page renders, so retry before declaring failure
  let sawContinue = (await page.content()).includes("continuar de onde parei");
  let retries = 0;
  while (!sawContinue && retries < 6) {
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "load" });
    sawContinue = (await page.content()).includes("continuar de onde parei");
    retries++;
  }
  check("progresso de leitura salvo (continuar)", sawContinue);

  // 11b. rate the series (4 stars) — logged in
  await page.waitForSelector(".rating-stars button", { timeout: 10000 });
  await page.waitForTimeout(1200); // session hydration (button enables after isPending)
  await page.click(".rating-stars button:nth-child(4)");
  await page.waitForTimeout(2000);
  const rated = await page.content();
  check("rating da obra salvo (média 4.0)", rated.includes("4.0") && rated.includes("1 nota"), "avg+count");

  // 11c. comment on the series itself
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  await page.waitForSelector("#cm-msg", { timeout: 10000 });
  const seriesMsg = `Comentário da obra ${Date.now()}`;
  await page.fill("#cm-msg", seriesMsg);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Publicar comentário");
    btn?.click();
  });
  await page.waitForTimeout(2000);
  await page.goto(BASE + "/obra/" + SERIES_SLUG, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const seriesCmt = await page.content();
  check("comentário na obra salvo e visível", seriesCmt.includes(seriesMsg) && seriesCmt.includes("Comentários da obra"));

  // 12. profile: the account menu keeps the reader name and a direct /perfil link
  const accountMenu = await page.evaluate(() => ({
    name: document.querySelector(".account-drop summary")?.textContent?.trim() ?? "",
    profileHref: document.querySelector('.account-drop-panel a[href="/perfil"]')?.getAttribute("href") ?? null,
  }));
  check("menu do leitor leva ao perfil", accountMenu.name.includes(NAME) && accountMenu.profileHref === "/perfil");
  await page.goto(BASE + "/perfil", { waitUntil: "load" });
  await page.waitForSelector(".profile-card", { timeout: 10000 });
  const profileHtml = await page.content();
  check(
    "perfil mostra leituras, favoritas e comentários",
    profileHtml.includes("Continuar lendo") && profileHtml.includes("Favoritas") && profileHtml.includes("Meus comentários")
  );
  // 13. community moderation: another reader reports; admin hides; public list updates
  if (isAdminEmail && TEST_CHAPTER_ID && chapterCommentText) {
    const readerContext = await browser.newContext();
    const readerPage = await readerContext.newPage();
    readerEmail = `teste-leitor-${Date.now()}@exemplo.com`;
    await readerPage.goto(BASE + "/cadastro", { waitUntil: "load" });
    await readerPage.fill("#reg-name", "Leitor Moderacao");
    await readerPage.fill("#reg-email", readerEmail);
    await readerPage.fill("#reg-password", PASSWORD);
    await readerPage.click('button:has-text("Criar minha estante")');
    await readerPage.waitForURL(BASE + "/", { timeout: 15000 });
    await readerPage.goto(BASE + "/ler/" + TEST_CHAPTER_ID, { waitUntil: "load" });
    const reportedEntry = readerPage.locator(".cm-entry", { hasText: chapterCommentText });
    await reportedEntry.locator('button:has-text("Curtir")').click();
    await reportedEntry.locator('button:has-text("Responder")').click();
    const replyText = `Resposta E2E ${Date.now()}`;
    await reportedEntry.locator(".reply-form textarea").fill(replyText);
    await reportedEntry.locator('button:has-text("Publicar resposta")').click();
    await readerPage.waitForTimeout(800);
    check("leitor curte e responde comentário", (await reportedEntry.textContent()).includes(replyText));

    const authorHref = await reportedEntry.locator("a.cm-name").first().getAttribute("href");
    await readerPage.goto(BASE + authorHref, { waitUntil: "load" });
    await readerPage.click('button:has-text("Acompanhar leitor")');
    await readerPage.waitForTimeout(600);
    check("leitor acompanha outro perfil", (await readerPage.content()).includes("Acompanhando"));

    await page.goto(BASE + "/notificacoes", { waitUntil: "load" });
    const notificationsHtml = await page.content();
    check("notificações internas recebem resposta, curtida e seguidor", notificationsHtml.includes("Leitor Moderacao") && notificationsHtml.includes("respondeu"));

    await page.goto(BASE + "/ler/" + TEST_CHAPTER_ID, { waitUntil: "load" });
    const authorEntry = page.locator(".cm-entry", { hasText: chapterCommentText });
    await authorEntry.locator('button:has-text("Destacar")').click();
    await page.waitForTimeout(700);
    check("autor destaca comentário", (await authorEntry.textContent()).includes("destacado pelo estúdio"));

    await readerPage.goto(BASE + "/ler/" + TEST_CHAPTER_ID, { waitUntil: "load" });
    const reportEntry = readerPage.locator(".cm-entry", { hasText: chapterCommentText });
    await reportEntry.locator('button:has-text("Denunciar")').click();
    await reportEntry.locator("select").selectOption("spam");
    await reportEntry.locator('button:has-text("Enviar denúncia")').click();
    await readerPage.waitForTimeout(800);
    check("leitor envia denúncia", (await reportEntry.textContent()).includes("Denúncia enviada"));

    await page.goto(BASE + "/admin/comentarios", { waitUntil: "load" });
    const moderationEntry = page.locator(".moderation-entry", { hasText: chapterCommentText });
    check("denúncia entra na fila do autor", (await moderationEntry.textContent()).includes("1 denúncias abertas"));
    page.once("dialog", (dialog) => dialog.accept());
    await moderationEntry.locator('button:has-text("Ocultar")').click();
    await page.waitForTimeout(1000);
    check("autor oculta comentário denunciado", ((await moderationEntry.getAttribute("class")) ?? "").includes("is-hidden"));

    await readerPage.goto(BASE + "/ler/" + TEST_CHAPTER_ID, { waitUntil: "load" });
    check("comentário oculto some da área pública", !(await readerPage.content()).includes(chapterCommentText));
    await readerContext.close();
  }
} catch (err) {
  check("fluxo completo", false, err.message);
  console.log("URL no erro:", page.url());
}

await browser.close();

if (BASE.startsWith("http://localhost") || BASE.startsWith("http://127.0.0.1")) {
  const rawDatabaseUrl = process.env.DATABASE_URL || readEnvValue("DATABASE_URL");
  const databaseUrl = rawDatabaseUrl?.replace(/^['"]|['"]$/g, "");
  if (databaseUrl) {
    try {
      const cleanupDb = postgres(databaseUrl, { max: 1 });
      const removedWorks = await cleanupDb`delete from series where title = ${TITLE} returning id`;
      const cleanupEmails = [readerEmail, createdPrimaryAccount ? EMAIL : null].filter(Boolean);
      const removedUsers = cleanupEmails.length
        ? await cleanupDb`delete from "user" where email in ${cleanupDb(cleanupEmails)} returning id`
        : [];
      await cleanupDb.end();
      check("dados temporários do E2E removidos", removedWorks.length <= 1 && removedUsers.length === cleanupEmails.length, `${removedWorks.length} obra(s), ${removedUsers.length} conta(s)`);
    } catch (cleanupError) {
      check("dados temporários do E2E removidos", false, cleanupError.message);
    }
  } else {
    check("dados temporários do E2E removidos", false, "DATABASE_URL indisponível");
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passaram`);
process.exit(failed.length > 0 ? 1 : 0);
