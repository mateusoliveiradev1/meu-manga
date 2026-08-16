/* Captures screenshots of every surface at desktop + mobile viewports. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
mkdirSync("shots", { recursive: true });

/* discover the first public series + chapter from the home page, so captures
   never depend on seed sample data */
async function discoverPaths(page) {
  await page.goto(BASE + "/", { waitUntil: "load" });
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href") ?? "")
      .filter((h) => h.startsWith("/obra/"))
  );
  const slug = hrefs[0]?.replace("/obra/", "") ?? "";
  if (!slug) return [["home", "/"], ["login", "/entrar"], ["register", "/cadastro"]];
  await page.goto(BASE + "/obra/" + slug, { waitUntil: "load" });
  const chapterHref = await page.evaluate(() => {
    const a = document.querySelector("a[href^='/ler/']");
    return a ? a.getAttribute("href") : null;
  });
  const readerPath = chapterHref ?? "/";
  return [
    ["home", "/"],
    ["home-generos", "/?genero=horror"], // genre filter active on the grid
    ["genero", "/genero/horror"], // dedicated genre page
    ["obra", "/obra/" + slug],
    ["reader", readerPath, "page3"], // navigate to the light "paper" page
    ["reader-end", readerPath, "end"], // click through to the FIM stamp
    ["reader-dupla", readerPath, "dupla"], // two pages side by side
    ["login", "/entrar"],
    ["register", "/cadastro"],
    ["sobre", "/sobre"],
  ];
}

const browser = await chromium.launch();
const discover = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const surfaces = await discoverPaths(discover);
await discover.close();

async function navigate(page, mode) {
  if (!mode) return;
  // the reader defaults to scroll mode — switch to page mode for the nav-arrow shots
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll(".rt-mode button")).find((b) => b.textContent?.trim() === "Página");
    btn?.click();
  });
  await page.waitForTimeout(400);
  if (mode === "page3") {
    await page.evaluate(() => document.querySelector(".page-nav.next")?.click());
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector(".page-nav.next")?.click());
    await page.waitForTimeout(500);
  } else if (mode === "end") {
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => document.querySelector(".page-nav.next")?.click());
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(600);
  } else if (mode === "dupla") {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll(".rt-mode button")).find((b) => b.textContent?.trim() === "Dupla");
      btn?.click();
    });
    await page.waitForTimeout(500);
  }
}


// desktop
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [name, path, mode] of surfaces) {
  await desktop.goto(BASE + path, { waitUntil: "load" });
  await navigate(desktop, mode);
  await desktop.waitForTimeout(800);
  await desktop.screenshot({ path: `shots/desktop-${name}.png`, fullPage: true });
  console.log(`desktop-${name}.png`);
}

// mobile
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
for (const [name, path, mode] of surfaces) {
  await mobile.goto(BASE + path, { waitUntil: "load" });
  await navigate(mobile, mode);
  await mobile.waitForTimeout(800);
  await mobile.screenshot({ path: `shots/mobile-${name}.png`, fullPage: true });
  console.log(`mobile-${name}.png`);
}

await browser.close();
console.log("done");
