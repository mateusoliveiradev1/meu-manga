/* Validates screenshots: not blank, not uniform, correct dark palette. */
import { readFileSync } from "node:fs";
import { PNG } from "pngjs";

const files = process.argv.slice(2);
let fail = 0;

for (const f of files) {
  const png = PNG.sync.read(readFileSync(f));
  const { width, height, data } = png;
  const px = (x, y) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  // sample a grid over the FIRST viewport only (content concentrates there)
  const vh = Math.min(height, 1000);
  const samples = [];
  for (let gy = 0; gy < 10; gy++) {
    for (let gx = 0; gx < 10; gx++) {
      samples.push(px(Math.floor((gx + 0.5) * (width / 10)), Math.floor((gy + 0.5) * (vh / 10))));
    }
  }
  const avg = samples.reduce((a, c) => [a[0] + c[0] / 100, a[1] + c[1] / 100, a[2] + c[2] / 100], [0, 0, 0]);
  const unique = new Set(samples.map((s) => s.join(","))).size;
  const readerLight = f.includes("-reader"); // the reader captures the paper page: light is correct
  const washed = avg[0] > 250 && avg[1] > 250 && avg[2] > 250;
  const blank = unique < 3; // a single uniform color = broken capture
  const tooDark = !readerLight && avg[0] < 4 && avg[1] < 4 && avg[2] < 4; // pure black void with nothing
  const ok = !washed && !blank && !tooDark;
  if (!ok) {
    fail++;
    console.log(`BAD  ${f}  avg rgb=(${avg.map((v) => Math.round(v)).join(",")}) unique=${unique} (washed=${washed} blank=${blank} void=${tooDark})`);
  } else {
    console.log(`OK   ${f}  avg rgb=(${avg.map((v) => Math.round(v)).join(",")}) unique=${unique}`);
  }
}

console.log(fail === 0 ? "\nall shots valid" : `\n${fail} invalid`);
process.exit(fail > 0 ? 1 : 0);
