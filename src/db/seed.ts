/* Seeds the database with synthetic sample content on first run.
   Run with: node --env-file=.env src/db/seed.ts  (or npm run db:seed) */

import { randomUUID } from "node:crypto";
import { db, sql } from "./client";
import { chapters, comments, pages, series, user } from "./schema";
import { writeSampleFiles } from "./sampleArt";

const SAMPLE_SERIES = {
  slug: "o-farol-entre-mundos",
  title: "O Farol Entre Mundos",
  synopsis:
    "Num arquipélago onde as estrelas caem no mar, Lumi mantém o farol que devolve cada estrela perdida ao céu. Toda noite ela recolhe uma, toda noite ela a solta — até a noite em que uma estrela cai com um nome gravado: o dela.\n\nUma história sobre luz, perda e as coisas que insistimos em devolver.",
  cover: "/samples/cover-farol.svg",
  status: "ongoing",
  tags: "fantasia,drama,mistério",
};

async function main() {
  const existing = await db.select({ id: series.id }).from(series).limit(1);
  if (existing.length > 0) {
    console.log("Banco já tem conteúdo — seed pulado.");
    return;
  }
  writeSampleFiles();

  const [s] = await db
    .insert(series)
    .values(SAMPLE_SERIES)
    .returning({ id: series.id });

  const [c1] = await db
    .insert(chapters)
    .values({
      seriesId: s.id,
      number: 1,
      title: "A estrela que caiu",
      published: true,
      publishedAt: new Date(Date.now() - 9 * 86400000),
      views: 1280,
    })
    .returning({ id: chapters.id });

  const [c2] = await db
    .insert(chapters)
    .values({
      seriesId: s.id,
      number: 2,
      title: "Maré de vidro",
      published: true,
      publishedAt: new Date(Date.now() - 2 * 86400000),
      views: 864,
    })
    .returning({ id: chapters.id });

  await insertPages(c1.id, 1, 8);
  await insertPages(c2.id, 2, 6);

  // display-only users so the sample comments have realistic authors
  const now = new Date();
  const [estrela] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "EstrelaCadente",
      email: "estrela@exemplo.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: user.id });
  const [marujo] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "Marujo",
      email: "marujo@exemplo.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: user.id });
  const [luna] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "Luna",
      email: "luna@exemplo.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: user.id });

  await db.insert(comments).values([
    {
      chapterId: c1.id,
      userId: estrela.id,
      content:
        "Que ambientação linda! A página do farol com as estrelas caindo me deu arrepios. Já quero o próximo capítulo. (Comentários de amostra — crie sua conta para comentar de verdade.)",
      createdAt: new Date(Date.now() - 8 * 86400000),
    },
    {
      chapterId: c1.id,
      userId: marujo.id,
      content: "Cheguei pelo mar, fiquei pela história. (Comentário de amostra.)",
      createdAt: new Date(Date.now() - 6 * 86400000),
    },
    {
      chapterId: c2.id,
      userId: luna.id,
      content: "O 'mar de vidro' ficou exatamente como o nome promete. (Comentário de amostra.)",
      createdAt: new Date(Date.now() - 1 * 86400000),
    },
  ]);

  console.log("Seed concluído: 1 obra, 2 capítulos, 14 páginas, 3 comentários de amostra.");
  await sql.end();
}

async function insertPages(chapterId: number, chapterIndex: number, count: number) {
  const rows = [];
  for (let i = 1; i <= count; i++) {
    rows.push({
      chapterId,
      position: i,
      src: `/samples/ch${chapterIndex}-p${String(i).padStart(2, "0")}.svg`,
    });
  }
  await db.insert(pages).values(rows);
}

main().catch((err) => {
  console.error("Falha no seed:", err);
  process.exit(1);
});
