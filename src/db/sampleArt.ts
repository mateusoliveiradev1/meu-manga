import fs from "node:fs";
import path from "node:path";

/* Synthetic sample content — labeled as sample, replace via the admin panel. */

const SAMPLES_DIR = path.join(process.cwd(), "public", "samples");

export function ensureSamplesDir() {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function halftone(opacity = 0.16, size = 3): string {
  return `<pattern id="ht${size}" width="${size * 2}" height="${size * 2}" patternUnits="userSpaceOnUse">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#1a1a2e" opacity="${opacity}"/>
  </pattern>`;
}

function speedlines(x: number, y: number, w: number, h: number): string {
  const lines: string[] = [];
  for (let i = 0; i < 26; i++) {
    const lx = x + Math.random() * w;
    lines.push(
      `<line x1="${lx}" y1="${y}" x2="${lx + 14}" y2="${y + h}" stroke="#2b2b45" stroke-width="1.1" opacity="0.5"/>`
    );
  }
  return lines.join("");
}

function skyGradient(id: string, top: string, bottom: string): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
  </linearGradient>`;
}

function stars(count: number, area: { x: number; y: number; w: number; h: number }): string {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = area.x + Math.random() * area.w;
    const y = area.y + Math.random() * area.h;
    const r = 0.6 + Math.random() * 1.3;
    out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff7d6" opacity="${0.5 + Math.random() * 0.5}"/>`);
  }
  return out.join("");
}

function panel(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#101018" stroke-width="5"/>`;
}

function bubble(x: number, y: number, w: number, h: number, text: string): string {
  const cx = x + w / 2;
  const tail = `<path d="M ${cx - 6} ${y + h - 2} l -8 16 l 16 -8 z" fill="#ffffff" stroke="#101018" stroke-width="3"/>`;
  return `<g>${tail}
    <ellipse cx="${cx}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#ffffff" stroke="#101018" stroke-width="4"/>
    <text x="${cx}" y="${y + h / 2 + 5}" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="#101018">${text}</text>
  </g>`;
}

function caption(x: number, y: number, w: number, text: string): string {
  return `<text x="${x}" y="${y}" width="${w}" font-family="Georgia, serif" font-style="italic" font-size="15" fill="#3a3a55">${text}</text>`;
}

function sea(x: number, y: number, w: number, h: number): string {
  const path: string[] = [];
  let cur = y;
  let i = 0;
  while (cur < y + h) {
    path.push(
      `<path d="M ${x} ${cur + i * 6} q ${w / 6} ${-10} ${w / 3} 0 t ${w / 3} 0 t ${w / 3} 0" fill="none" stroke="#3f5f8f" stroke-width="2.4" opacity="0.75"/>`
    );
    i++;
    cur += 16;
  }
  return path.join("");
}

function lighthouse(x: number, baseY: number, h = 150): string {
  const topY = baseY - h;
  return `<g>
    <rect x="${x - 26}" y="${baseY - 14}" width="52" height="14" fill="#3a3a4d"/>
    <polygon points="${x - 18},${baseY - 14} ${x + 18},${baseY - 14} ${x + 9},${topY + 26} ${x - 9},${topY + 26}" fill="#f2efe6" stroke="#101018" stroke-width="2"/>
    <rect x="${x - 7}" y="${topY}" width="14" height="26" fill="#c93a3a" stroke="#101018" stroke-width="2"/>
    <polygon points="${x - 12},${topY - 4} ${x + 12},${topY - 4} ${x},${topY - 22}" fill="#ffd24a" opacity="0.9"/>
    <polygon points="${x},${topY - 14} ${x + 60},${topY - 46} ${x + 52},${topY - 12}" fill="#ffd24a" opacity="0.28"/>
    <polygon points="${x},${topY - 14} ${x - 60},${topY - 46} ${x - 52},${topY - 12}" fill="#ffd24a" opacity="0.28"/>
  </g>`;
}

function moon(x: number, y: number, r = 26): string {
  return `<g>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#f7f2d8" stroke="#d9c98a" stroke-width="1"/>
    <circle cx="${x - 8}" cy="${y - 6}" r="${r * 0.82}" fill="#e9e2bd"/>
  </g>`;
}

const SCENES = [
  { top: "#2b2350", bottom: "#5b3a6e" },
  { top: "#1d3a5f", bottom: "#4b7aa8" },
  { top: "#3d1f3d", bottom: "#8a4a4a" },
  { top: "#0f1f3f", bottom: "#27446b" },
];

const CAPTIONS = [
  "“Naquela noite, o farol acendeu sozinho.”",
  "E o mar, que nunca respondia, respondeu.",
  "Cada estrela guarda uma história de quem a soltou.",
  "Lumi sabia que o céu cobra caro por cada luz devolvida.",
];

export function renderSamplePage(pageIndex: number, chapterIndex: number): string {
  const W = 900;
  const H = 1280;
  const s = SCENES[chapterIndex % SCENES.length];
  const rnd = mulberry32(pageIndex * 7919 + chapterIndex * 104729);
  const horizon = 760 + rnd() * 120;
  const seaTop = horizon;
  const twoPanels = pageIndex % 3 === 2;
  const captionText = CAPTIONS[pageIndex % CAPTIONS.length];

  /* a light "paper" page every few pages — the tankōbon signature: ink on
     warm paper floating over the void (shows the reader's contrast) */
  if (pageIndex % 4 === 3) {
    const ink = "#1c1c28";
    const paper = "#f2efe6";
    const p2 = "#e9e3d2";
    const p3 = "#dfd8c2";
    return svg(
      W,
      H,
      `
      <defs>
        ${halftone(0.1, 3)}${halftone(0.07, 4)}
        <clipPath id="lp1"><rect x="40" y="60" width="${W - 80}" height="430" rx="6"/></clipPath>
        <clipPath id="lp2"><rect x="40" y="530" width="${W - 80}" height="460" rx="6"/></clipPath>
        <clipPath id="lp3"><rect x="40" y="1030" width="${W - 80}" height="180" rx="6"/></clipPath>
      </defs>
      <rect x="0" y="0" width="${W}" height="${H}" fill="${paper}"/>
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#ht3)" opacity="0.55"/>
      <g clip-path="url(#lp1)">
        <rect x="40" y="60" width="${W - 80}" height="430" fill="${p2}"/>
        <circle cx="${W * 0.78}" cy="150" r="52" fill="#f7f0d8" stroke="${ink}" stroke-width="3"/>
        <path d="M 40 330 Q ${W / 4} 300 ${W / 2} 330 T ${W - 40} 330 L ${W - 40} 490 L 40 490 Z" fill="#c9c2a8"/>
        <path d="M 40 350 Q ${W / 4} 322 ${W / 2} 350 T ${W - 40} 350" fill="none" stroke="${ink}" stroke-width="3" opacity="0.5"/>
        <path d="M 180 350 L 180 410 L 240 410 L 240 350" fill="none" stroke="${ink}" stroke-width="4"/>
        <path d="M 160 350 Q 210 320 260 350" fill="none" stroke="${ink}" stroke-width="4"/>
        ${caption(W * 0.2, 470, W * 0.6, "Manhã clara depois da tempestade.")}
      </g>
      <g clip-path="url(#lp2)">
        <rect x="40" y="530" width="${W - 80}" height="460" fill="${p3}"/>
        ${speedlines(W * 0.45, 530, W * 0.55, 460)}
        ${bubble(W / 2 - 120, 640, 240, 120, "O mar devolveu a luz!")}
      </g>
      <g clip-path="url(#lp3)">
        <rect x="40" y="1030" width="${W - 80}" height="180" fill="${p2}"/>
        ${caption(70, 1090, W - 140, captionText)}
      </g>
      ${panel(40, 60, W - 80, 430)}
      ${panel(40, 530, W - 80, 460)}
      ${panel(40, 1030, W - 80, 180)}
      `
    );
  }

  const scene = `
    ${skyGradient("sky", s.top, s.bottom)}
    <defs>${halftone(0.14, 3)}${halftone(0.1, 4)}</defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky)"/>
    ${stars(70, { x: 0, y: 0, w: W, h: horizon })}
    ${moon(700 + rnd() * 120, 120 + rnd() * 60)}
    <rect x="0" y="${seaTop}" width="${W}" height="${H - seaTop}" fill="#22334f"/>
    ${sea(0, seaTop, W, H - seaTop)}
    ${lighthouse(180 + rnd() * 60, seaTop - 6)}
    ${pageIndex % 3 === 1 ? `<line x1="${W * 0.7}" y1="90" x2="${W * 0.62}" y2="190" stroke="#ffd24a" stroke-width="3" opacity="0.9"/>
    <line x1="${W * 0.7}" y1="90" x2="${W * 0.62}" y2="190" stroke="#fff3c4" stroke-width="6" opacity="0.4"/>` : ""}
    ${pageIndex % 3 === 0 ? `<g opacity="0.5">${speedlines(W * 0.55, 0, W * 0.45, H)}</g>` : ""}
  `;

  if (twoPanels) {
    return svg(
      W,
      H,
      `
      <defs><clipPath id="p1"><rect x="40" y="60" width="${W - 80}" height="480" rx="6"/></clipPath><clipPath id="p2"><rect x="40" y="580" width="${W - 80}" height="560" rx="6"/></clipPath></defs>
      ${scene}
      <g clip-path="url(#p1)"><rect x="40" y="60" width="${W - 80}" height="480" fill="url(#sky)"/>${stars(40, { x: 40, y: 60, w: W - 80, h: 300 })}${lighthouse(220, 420)}</g>
      <g clip-path="url(#p2)"><rect x="40" y="580" width="${W - 80}" height="560" fill="#f7f5ee"/><rect x="40" y="580" width="${W - 80}" height="560" fill="url(#ht3)" opacity="0.7"/>${bubble(W / 2 - 120, 700, 240, 120, "Quem deixou essa luz cair?")}</g>
      ${panel(40, 60, W - 80, 480)}
      ${panel(40, 580, W - 80, 560)}
      ${caption(70, H - 60, W - 140, captionText)}
      `
    );
  }

  return svg(
    W,
    H,
    `
    ${scene}
    <rect x="40" y="60" width="${W - 80}" height="${H - 160}" fill="none" stroke="#101018" stroke-width="5"/>
    ${pageIndex % 2 === 0 ? bubble(W / 2 - 130, H * 0.62, 260, 130, "O céu está mais pesado hoje.") : ""}
    ${caption(70, H - 70, W - 140, captionText)}
    `
  );
}

function svg(W: number, H: number, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${inner}
</svg>`;
}

export function renderSampleCover(title: string, tagline: string): string {
  const W = 600;
  const H = 800;
  const words = title.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 14) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);

  const titleSvg = lines
    .map(
      (l, i) =>
        `<text x="${W / 2}" y="${330 + i * 46}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="38" fill="#f4f2ff">${l}</text>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${skyGradient("csky", "#14123a", "#3d2a55")}
  ${halftone(0.12, 3)}
  <defs><clipPath id="coverClip"><rect width="${W}" height="${H}"/></clipPath></defs>
  <g clip-path="url(#coverClip)">
    <rect width="${W}" height="${H}" fill="url(#csky)"/>
    ${stars(90, { x: 0, y: 0, w: W, h: 620 })}
    ${moon(430, 110, 34)}
    <line x1="150" y1="60" x2="90" y2="150" stroke="#ffd24a" stroke-width="3" opacity="0.9"/>
    <rect x="0" y="600" width="${W}" height="200" fill="#1d2c45"/>
    ${sea(0, 604, W, 196)}
    ${lighthouse(160, 606, 170)}
  </g>
  <rect width="${W}" height="${H}" fill="none" stroke="#101018" stroke-width="14"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="#ffd24a" stroke-width="2" opacity="0.7"/>
  ${titleSvg}
  <text x="${W / 2}" y="${545}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="19" fill="#c2c0ec">${tagline}</text>
  <text x="${W / 2}" y="${760}" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#9a97c9">VOLUME 1 · CAPA DE AMOSTRA</text>
</svg>`;
}

export function writeSampleFiles() {
  ensureSamplesDir();
  const cover = path.join(SAMPLES_DIR, "cover-farol.svg");
  if (!fs.existsSync(cover)) {
    fs.writeFileSync(cover, renderSampleCover("O Farol Entre Mundos", "cada estrela tem uma história"));
  }
  for (let ch = 1; ch <= 2; ch++) {
    const count = ch === 1 ? 8 : 6;
    for (let p = 1; p <= count; p++) {
      const file = path.join(SAMPLES_DIR, `ch${ch}-p${String(p).padStart(2, "0")}.svg`);
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, renderSamplePage(p, ch));
      }
    }
  }
}
