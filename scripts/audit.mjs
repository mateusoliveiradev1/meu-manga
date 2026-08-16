/* DOM-level finish audit: h1 count, overflow, broken images, empty content. */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";

/* discover the first public series + chapter from the home page, so the audit
   never depends on seed sample data */
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
  return [
    ["home", "/"],
    ["obra", "/obra/" + slug],
    ["reader", chapterHref ?? "/"],
    ["login", "/entrar"],
    ["register", "/cadastro"],
  ];
}

const browser = await chromium.launch();
const discover = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const surfaces = await discoverPaths(discover);
await discover.close();
let issues = 0;

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  for (const [name, path] of surfaces) {
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const report = await page.evaluate(() => {
      const h1s = [...document.querySelectorAll("h1")].map((e) => e.textContent.trim());
      const broken = [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.slice(0, 60));
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const text = document.body.innerText.trim().length;
      const distortedCovers = [...document.querySelectorAll(
        ".featured-cover img, .series-card .cover img, .latest-cover img, .home-progress-card img, .profile-fav img, .obra-cover img"
      )]
        .map((image) => {
          const rect = image.getBoundingClientRect();
          return { src: image.src.slice(0, 60), width: rect.width, height: rect.height };
        })
        .filter(({ width, height }) => width > 0 && height > 0 && (width / height < 0.68 || width / height > 0.82));
      return { h1s, broken, overflow, text, distortedCovers };
    });
    const problems = [];
    if (report.h1s.length !== 1) problems.push(`h1=${report.h1s.length} (${report.h1s.join("|")})`);
    if (report.broken.length) problems.push(`broken imgs: ${report.broken.join(", ")}`);
    if (report.overflow) problems.push("horizontal overflow");
    if (report.text < 40) problems.push("near-empty page");
    if (report.distortedCovers.length) {
      problems.push(
        `cover ratio: ${report.distortedCovers
          .map((cover) => `${Math.round(cover.width)}x${Math.round(cover.height)}`)
          .join(", ")}`
      );
    }
    if (problems.length) {
      issues++;
      console.log(`ISSUE ${viewport.name}-${name}: ${problems.join("; ")}`);
    } else {
      console.log(`OK    ${viewport.name}-${name}  h1="${report.h1s[0]}"`);
    }
  }
  await page.close();
}

await browser.close();
console.log(issues === 0 ? "\naudit clean" : `\n${issues} issues`);
process.exit(issues > 0 ? 1 : 0);
