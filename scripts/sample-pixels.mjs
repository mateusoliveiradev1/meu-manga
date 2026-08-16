import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];
const buf = fs.readFileSync(path.join(process.cwd(), ".impeccable", "review", file));
const b64 = buf.toString("base64");

const browser = await chromium.launch();
const page = await browser.newPage();
const points = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = "data:image/png;base64," + b64;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const pts = [
    [0.5, 0.02],
    [0.05, 0.1],
    [0.95, 0.1],
    [0.5, 0.3],
    [0.5, 0.5],
    [0.05, 0.9],
    [0.95, 0.9],
    [0.5, 0.98],
  ];
  const out = [];
  for (const [fx, fy] of pts) {
    const x = Math.round(fx * c.width);
    const y = Math.round(fy * c.height);
    const d = ctx.getImageData(x, y, 1, 1).data;
    out.push(`(${Math.round(fx * 100)}%,${Math.round(fy * 100)}%) rgb(${d[0]},${d[1]},${d[2]})`);
  }
  return { w: c.width, h: c.height, out };
}, b64);
console.log(file, points.w + "x" + points.h);
points.out.forEach((l) => console.log("  ", l));
await browser.close();
