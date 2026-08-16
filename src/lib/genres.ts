/**
 * Gêneros canônicos do estúdio. As obras guardam tags como texto separado
 * por vírgula (coluna `tags`); estes são os gêneros "de verdade" usados na
 * curadoria (filtros, dropdown do header). Tags fora da lista continuam
 * valendo como marcadores livres — só não entram na curadoria.
 *
 * O matching é tolerante: sinônimos ("terror" → Horror), compostos
 * ("terror e aventura" → Horror + Aventura) e subgêneros ("ação sobrenatural"
 * → Ação + Sobrenatural) são resolvidos para os gêneros canônicos — assim o
 * filtro funciona com obras postadas antes dos chips existirem.
 */
export const GENRES = [
  { name: "Ação", slug: "acao" },
  { name: "Aventura", slug: "aventura" },
  { name: "Comédia", slug: "comedia" },
  { name: "Drama", slug: "drama" },
  { name: "Fantasia", slug: "fantasia" },
  { name: "Ficção científica", slug: "ficcao-cientifica" },
  { name: "Horror", slug: "horror" },
  { name: "Isekai", slug: "isekai" },
  { name: "Josei", slug: "josei" },
  { name: "Mecha", slug: "mecha" },
  { name: "Mistério", slug: "misterio" },
  { name: "Psicológico", slug: "psicologico" },
  { name: "Romance", slug: "romance" },
  { name: "Seinen", slug: "seinen" },
  { name: "Shoujo", slug: "shoujo" },
  { name: "Shounen", slug: "shounen" },
  { name: "Slice of life", slug: "slice-of-life" },
  { name: "Sobrenatural", slug: "sobrenatural" },
  { name: "Esporte", slug: "esporte" },
  { name: "Tragédia", slug: "tragedia" },
] as const;

const BY_SLUG: Map<string, { name: string; slug: string }> = new Map(GENRES.map((g) => [g.slug, g]));

/** Uma linha de apresentação por gênero (usada nas páginas /genero/[slug]). */
export const GENRE_BLURBS: Record<string, string> = {
  acao: "Lutas, poderes e adrenalina — histórias onde a ação manda.",
  aventura: "Jornadas, mapas e descobertas por mundos desconhecidos.",
  comedia: "Risadas garantidas — do humor leve ao absurdo.",
  drama: "Conflitos profundos, emoções fortes e escolhas difíceis.",
  fantasia: "Mundos mágicos, criaturas e sistemas próprios.",
  "ficcao-cientifica": "Futuros distantes, tecnologia e as grandes questões da humanidade.",
  horror: "Suspense, medo e o sobrenatural no seu pior.",
  isekai: "Transportados para outro mundo — reencarnação, jogo ou portal.",
  josei: "Histórias para o público adulto feminino — relacionamentos e vida real.",
  mecha: "Robôs gigantes, pilotos e guerras movidas a tecnologia.",
  misterio: "Enigmas, pistas e revelações que prendem até o fim.",
  psicologico: "Mentes complexas, dilemas morais e camadas ocultas.",
  romance: "Histórias de amor, encontros e desencontros.",
  seinen: "Para o público adulto — temas maduros e narrativas densas.",
  shoujo: "Romance e emoção com foco no público jovem feminino.",
  shounen: "Ação e amizade com foco no público jovem masculino.",
  "slice-of-life": "O cotidiano como protagonista — calmo, próximo e verdadeiro.",
  sobrenatural: "Fantasmas, maldições e o que existe além do visível.",
  esporte: "Competição, treino e superação dentro e fora das quadras.",
  tragedia: "Finais difíceis e histórias que marcam fundo.",
};

/** Sinônimos comuns (sem acento, minúsculo) → nome canônico. */
const ALIASES: Record<string, string> = {
  acao: "Ação",
  aventura: "Aventura",
  comedia: "Comédia",
  comedic: "Comédia",
  drama: "Drama",
  fantasia: "Fantasia",
  fantastico: "Fantasia",
  "ficcao cientifica": "Ficção científica",
  "ficcao-cientifica": "Ficção científica",
  "ficcao cientifica e aventura": "Ficção científica",
  sci: "Ficção científica",
  scifi: "Ficção científica",
  "sci-fi": "Ficção científica",
  "ficcao espacial": "Ficção científica",
  horror: "Horror",
  terror: "Horror",
  isekai: "Isekai",
  josei: "Josei",
  mecha: "Mecha",
  misterio: "Mistério",
  "suspense": "Mistério",
  psicologico: "Psicológico",
  romance: "Romance",
  romantico: "Romance",
  seinen: "Seinen",
  shonen: "Shounen",
  shounen: "Shounen",
  shoujo: "Shoujo",
  shojo: "Shoujo",
  "slice of life": "Slice of life",
  sliceoflife: "Slice of life",
  cotidiano: "Slice of life",
  sobrenatural: "Sobrenatural",
  esporte: "Esporte",
  esportes: "Esporte",
  tragedia: "Tragédia",
};

/** Separa uma string de tags em fragmentos (vírgula, ponto e vírgula, barra, "e"). */
function splitFragments(raw: string): string[] {
  return raw
    .split(/,|;|\/|·|\s+e\s+|\s+&amp;\s+|\s+&\s+/i)
    .map((f) => f.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Gêneros canônicos que um fragmento de tag representa. */
function genresForFragment(fragment: string): string[] {
  const key = stripAccents(fragment);
  const out = new Set<string>();
  const alias = ALIASES[key];
  if (alias) out.add(alias);
  // subgênero composto: "ação sobrenatural" → Ação + Sobrenatural
  if (out.size === 0 || fragment.includes(" ")) {
    const plain = stripAccents(fragment);
    for (const g of GENRES) {
      const nameKey = stripAccents(g.name);
      const re = new RegExp(`\\b${nameKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(plain)) out.add(g.name);
    }
  }
  return [...out];
}

/** Todos os gêneros canônicos presentes numa string de tags (deduplicados, em ordem canônica). */
export function genresIn(tags: string): string[] {
  const found = new Set<string>();
  for (const frag of splitFragments(tags)) {
    for (const name of genresForFragment(frag)) found.add(name);
  }
  const order: Map<string, number> = new Map(GENRES.map((g, i) => [g.name, i]));
  return [...found].sort((a, b) => (order.get(a)! - order.get(b)!));
}

/** Normaliza uma string de tags: resolve gêneros canônicos e preserva o resto como extras. */
export function normalizeTags(raw: string): string {
  const canonical = genresIn(raw);
  const seen = new Set<string>(canonical.map((c) => c.toLowerCase()));
  const extras: string[] = [];
  for (const frag of splitFragments(raw)) {
    const matched = genresForFragment(frag).length > 0;
    if (!matched && !seen.has(frag.toLowerCase())) {
      seen.add(frag.toLowerCase());
      extras.push(frag);
    }
  }
  extras.sort((a, b) => a.localeCompare(b, "pt-BR"));
  return [...canonical, ...extras].join(", ");
}

/** Slugs canônicos presentes numa string de tags (para filtrar por gênero). */
export function genreSlugsIn(tags: string): string[] {
  return genresIn(tags)
    .map((name) => GENRES.find((g) => g.name === name)?.slug ?? "")
    .filter(Boolean);
}

/** True se a string de tags resolve para o gênero canônico (por nome). */
export function hasGenre(tags: string, genreName: string): boolean {
  return genresIn(tags).some((n) => n === genreName);
}

/** Título legível de um slug de gênero (ou null se desconhecido). */
export function genreBySlug(slug: string): { name: string; slug: string } | null {
  return BY_SLUG.get(slug) ?? null;
}
