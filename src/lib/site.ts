export const SITE_NAME = process.env.SITE_NAME || "Meu Mangá";
export const SITE_TAGLINE = "Leia mangás online";
export const SITE_DESCRIPTION =
  "Leia mangás online, descubra novas obras e acompanhe capítulos, favoritos e seu progresso de leitura em um só lugar.";

/** URL pública do site — usada em metadata (og:image, sitemap, RSS). */
export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Converte um caminho (ou URL) em URL absoluta para as meta tags. */
export function absoluteUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}
