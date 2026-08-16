/* Captures admin surfaces at desktop + mobile using a temporary admin account. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "voce@exemplo.com";
const PASSWORD = "senha-teste-123";
const NAME = "Autor de Teste";
mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// register (or login) as admin — same context is reused for screenshots
await page.goto(BASE + "/cadastro", { waitUntil: "load" });
await page.fill("#reg-name", NAME);
await page.fill("#reg-email", ADMIN_EMAIL);
await page.fill("#reg-password", PASSWORD);
await page.click('button[type="submit"]');
const redirected = await page.waitForURL(BASE + "/", { timeout: 8000 }).then(() => true).catch(() => false);
if (!redirected) {
  await page.goto(BASE + "/entrar", { waitUntil: "load" });
  await page.fill("#login-email", ADMIN_EMAIL);
  await page.fill("#login-password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE + "/", { timeout: 15000 });
}

const surfaces = [
  ["admin", "/admin"],
  ["admin-nova-obra", "/admin/obras/novo"],
];

for (const [name, path] of surfaces) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "");
  console.log(`desktop-${name}: ${page.url()} h1=${h1}`);
  await page.screenshot({ path: `shots/desktop-${name}.png`, fullPage: true });
}

for (const [name, path] of surfaces) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "");
  console.log(`mobile-${name}: ${page.url()} h1=${h1}`);
  await page.screenshot({ path: `shots/mobile-${name}.png`, fullPage: true });
}

await browser.close();
console.log("done");
