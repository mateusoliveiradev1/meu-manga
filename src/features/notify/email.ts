import { and, eq, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db/client";
import { series, user, userFavorites } from "@/db/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { chapterLabel } from "@/lib/utils";

const FROM = process.env.EMAIL_FROM || "Meu Mangá <onboarding@resend.dev>";

export type NewChapterInfo = { id: number; seriesId: number; number: number; title: string };

/**
 * Avisa por email os leitores que favoritaram a série sobre o capítulo novo.
 * Sem RESEND_API_KEY configurado, apenas registra no log (modo dev).
 */
export async function notifyNewChapter(chaptersToNotify: NewChapterInfo[]): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[notify] RESEND_API_KEY ausente — ${chaptersToNotify.length} capítulo(s) sem email`);
    return;
  }
  const resend = new Resend(key);

  for (const ch of chaptersToNotify) {
    try {
      const [seriesRow] = await db
        .select({ title: series.title, slug: series.slug })
        .from(series)
        .where(eq(series.id, ch.seriesId))
        .limit(1);
      if (!seriesRow) continue;

      const favs = await db
        .select({ userId: userFavorites.userId })
        .from(userFavorites)
        .where(eq(userFavorites.seriesId, ch.seriesId));
      if (favs.length === 0) continue;

      const ids = favs.map((f) => f.userId);
      const readers = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(and(inArray(user.id, ids), eq(user.notifyNewChapters, true)));

      const url = `${SITE_URL}/ler/${ch.id}`;
      const chapterName = `${chapterLabel(ch.number)}${ch.title ? ` · ${ch.title}` : ""}`;
      await Promise.allSettled(
        readers.map((r) =>
          resend.emails.send({
            from: FROM,
            to: r.email,
            subject: `Novo capítulo de ${seriesRow.title}: ${chapterName}`,
            html: `
              <div style="font-family:system-ui,sans-serif;background:#0a0a0f;color:#ecebe6;padding:28px;border-radius:12px">
                <p style="margin:0 0 12px">Oi, <strong>${r.name || "leitor(a)"}</strong>!</p>
                <p style="margin:0 0 18px">Saiu capítulo novo de <strong>${seriesRow.title}</strong>: ${chapterName}</p>
                <a href="${url}" style="display:inline-block;background:#f5c518;color:#191204;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none">Ler agora →</a>
                <p style="margin:26px 0 0;font-size:12px;color:#858279">
                  Você recebe isso porque favoritou ${seriesRow.title} no ${SITE_NAME}.
                  <a href="${SITE_URL}/perfil" style="color:#f5c518">Gerenciar notificações</a>
                </p>
              </div>`,
            text: `Saiu capítulo novo de ${seriesRow.title}: ${chapterName}. Leia em ${url}. Você recebe isso porque favoritou a obra no ${SITE_NAME}.`,
          })
        )
      );
    } catch (err) {
      console.error("[notify] falha ao notificar", err);
    }
  }
}
