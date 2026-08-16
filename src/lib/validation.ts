import { z } from "zod";

export const seriesInputSchema = z.object({
  title: z.string().trim().min(1, "Dê um título para a obra.").max(120),
  slug: z.string().trim().max(60).optional(),
  synopsis: z.string().trim().max(4000).default(""),
  cover: z.string().trim().max(500).default(""),
  status: z.enum(["ongoing", "completed", "hiatus", "planned"]).default("ongoing"),
  tags: z.string().trim().max(200).default(""),
});

export const chapterInputSchema = z.object({
  number: z.coerce.number().positive("Informe o número do capítulo.").finite(),
  title: z.string().trim().max(120).default(""),
  cover: z.string().trim().max(500).default(""),
  published: z.boolean().default(false),
  // datetime-local do form ("2026-08-20T18:00") — vira timestamp de publicação agendada
  publishAt: z.string().trim().optional(),
});

export const commentInputSchema = z.object({
  content: z.string().trim().min(1, "Escreva um comentário.").max(500, "Comentário longo demais (máx. 500 caracteres)."),
  spoiler: z.boolean().optional().default(false),
});

export const commentTargetSchema = z
  .object({
    chapterId: z.number().int().positive().optional(),
    seriesId: z.number().int().positive().optional(),
  })
  .refine((t) => (t.chapterId != null) !== (t.seriesId != null), {
    message: "O comentário precisa de um destino: capítulo ou obra.",
  });

export const commentReportSchema = z.object({
  reason: z.enum(["spam", "abuse", "spoiler", "other"]),
  details: z.string().trim().max(240, "Detalhes longos demais (máx. 240 caracteres).").default(""),
});

export const ratingInputSchema = z.object({
  seriesId: z.coerce.number().int().positive(),
  value: z.coerce.number().int().min(1, "Escolha de 1 a 5 estrelas.").max(5, "Escolha de 1 a 5 estrelas."),
});

export const progressInputSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(0),
});

export const pagesInputSchema = z.object({
  srcs: z.array(z.string().trim().min(1)).max(200, "Muitas páginas (máx. 200 por capítulo)."),
});
