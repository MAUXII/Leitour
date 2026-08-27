import {
  googleCoverFromId,
  resolveGoogleVolumeCover,
} from "@/lib/catalog-cover-quality";

/** Google Books Volumes API — https://developers.google.com/books/docs/v1/using */

export type GoogleVolumeLite = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  isbn?: string;
  description?: string;
  subjects: string[];
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
};

type GoogleImageLinks = {
  thumbnail?: string;
  smallThumbnail?: string;
};

type GoogleVolumeInfo = {
  title?: string;
  authors?: string[];
  publishedDate?: string;
  description?: string;
  categories?: string[];
  language?: string;
  averageRating?: number;
  ratingsCount?: number;
  industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
  imageLinks?: GoogleImageLinks;
};

type GoogleVolume = {
  id?: string;
  volumeInfo?: GoogleVolumeInfo;
};

type GoogleListResponse = {
  items?: GoogleVolume[];
  error?: { code?: number; message?: string };
};

function apiKey(): string | undefined {
  return process.env.GOOGLE_BOOKS_API_KEY?.trim() || undefined;
}

function yearFromDate(value?: string): number | undefined {
  if (!value) return undefined;
  const m = value.match(/\d{4}/);
  return m ? Number(m[0]) : undefined;
}

function pickIsbn(info: GoogleVolumeInfo): string | undefined {
  const ids = info.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier;
  return isbn13 || isbn10;
}

/**
 * URL candidata síncrona (sem probe). zoom=1 — zoom=2 pixeliza / cropar.
 * Preferir `resolveGoogleVolumeCover` na busca.
 */
export function googleCoverUrl(
  info: GoogleVolumeInfo,
  volumeId?: string,
): string | undefined {
  if (volumeId) return googleCoverFromId(volumeId);
  const raw =
    info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || undefined;
  if (!raw) return undefined;
  return raw
    .replace(/^http:/i, "https:")
    .replace("&edge=curl", "")
    .replace(/zoom=\d+/i, "zoom=1");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapVolume(vol: GoogleVolume): GoogleVolumeLite | null {
  const id = vol.id?.trim();
  const info = vol.volumeInfo;
  if (!id || !info?.title) return null;
  const description = info.description
    ? stripHtml(info.description)
    : undefined;
  return {
    id,
    title: info.title,
    authors: info.authors ?? [],
    year: yearFromDate(info.publishedDate),
    coverUrl: googleCoverUrl(info, id),
    isbn: pickIsbn(info),
    description: description || undefined,
    subjects: (info.categories ?? []).slice(0, 4),
    averageRating: info.averageRating,
    ratingsCount: info.ratingsCount,
    language: info.language,
  };
}

async function fetchGoogleBooks(url: URL): Promise<Response> {
  const key = apiKey();
  if (key) url.searchParams.set("key", key);
  return fetch(url.toString(), {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });
}

/** Traduz query Leitour → q do Google Books (intitle / inauthor / subject / isbn). */
export function toGoogleBooksQuery(preparedQ: string): string {
  const raw = preparedQ.trim().replace(/\*$/, "");
  if (!raw) return "";

  const subject = raw.match(/^subject:(?:"([^"]+)"|(.+))$/i);
  if (subject) {
    const label = (subject[1] ?? subject[2] ?? "").trim().split("/")[0]!.trim();
    if (!label) return raw;
    return /\s/.test(label) ? `subject:"${label}"` : `subject:${label}`;
  }

  const isbn = raw.match(/^isbn:(.+)$/i);
  if (isbn) return `isbn:${isbn[1]!.replace(/[-\s]/g, "")}`;

  const author = raw.match(/^(?:author|inauthor):(?:"([^"]+)"|(.+))$/i);
  if (author) {
    const name = (author[1] ?? author[2] ?? "").trim();
    return `inauthor:${name}`;
  }

  const title = raw.match(/^(?:title|intitle):(?:"([^"]+)"|(.+))$/i);
  if (title) {
    const t = (title[1] ?? title[2] ?? "").trim();
    return `intitle:${t}`;
  }

  // Busca livre: sem forçar intitle — multi-palavra (pt-BR) some no HC
  // e o Google ranqueia melhor com q livre do que intitle:tudo.
  return raw;
}

function isJunkTitle(title: string): boolean {
  return /an[aá]lise de livro|resumo |book report|study guide|cliff.?notes|sparknotes|barron.?s|workbook|teacher.?s edition|quizlet|test prep|exam prep|cheat sheet|apostila|literatura comentada|annotated companion|critical companion to|reader.?s guide|book club questions|aula [0-9]|volume of essays about/i.test(
    title,
  );
}

function titleMatchScore(title: string, query: string): number {
  const q = query
    .replace(/^(?:intitle|inauthor|subject|isbn):/i, "")
    .replace(/"/g, "")
    .trim()
    .toLowerCase();
  if (!q || /^subject:/i.test(query)) return 0;
  const t = title.toLowerCase();
  if (t === q) return 30;
  if (t.startsWith(q)) return 22;
  if (t.includes(q)) return 14;
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return 0;
  const hit = words.filter((w) => t.includes(w)).length;
  return Math.round((hit / words.length) * 12);
}

function qualityScore(v: GoogleVolumeLite, preparedQ: string): number {
  if (isJunkTitle(v.title)) return -1000;
  let s = 0;
  if (v.coverUrl) s += 50;
  else s -= 40;
  if (v.ratingsCount && v.ratingsCount > 0) {
    s += Math.min(45, Math.log10(v.ratingsCount + 1) * 16);
  }
  if (v.averageRating) s += v.averageRating * 5;
  if (v.isbn) s += 6;
  if (v.description && v.description.length > 80) s += 8;
  if (v.authors.length) s += 4;
  s += titleMatchScore(v.title, preparedQ);
  // Prefer pt / en for Leitour hub
  if (v.language === "pt" || v.language === "pt-BR") s += 6;
  else if (v.language === "en") s += 2;
  return s;
}

function rankVolumes(
  vols: GoogleVolumeLite[],
  preparedQ: string,
): GoogleVolumeLite[] {
  const seen = new Set<string>();
  const out: GoogleVolumeLite[] = [];
  for (const v of vols) {
    if (isJunkTitle(v.title)) continue;
    const key = `${v.title.toLowerCase()}|${(v.authors[0] ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.sort(
    (a, b) => qualityScore(b, preparedQ) - qualityScore(a, preparedQ),
  );
}

/** Troca thumb Google duvidosa por OL/ISBN ou Google limpo; mantém fallback se o probe falhar. */
async function withVerifiedCovers(
  vols: GoogleVolumeLite[],
  limit: number,
): Promise<GoogleVolumeLite[]> {
  const pool = vols.slice(0, Math.min(vols.length, limit * 2 + 8));
  const settled = await Promise.all(
    pool.map(async (v): Promise<GoogleVolumeLite> => {
      try {
        const coverUrl = await resolveGoogleVolumeCover({
          id: v.id,
          isbn: v.isbn,
          fallbackThumb: v.coverUrl,
        });
        if (coverUrl) return { ...v, coverUrl };
      } catch {
        /* probe / rede */
      }
      // Não some da busca só porque a capa falhou o probe
      return {
        ...v,
        coverUrl: v.coverUrl ?? googleCoverFromId(v.id),
      };
    }),
  );
  return settled.slice(0, limit);
}

export async function searchGoogleBooks(
  preparedQ: string,
  limit = 20,
  page = 1,
): Promise<GoogleVolumeLite[]> {
  const q = toGoogleBooksQuery(preparedQ);
  if (!q) return [];

  const capped = Math.min(Math.max(limit, 1), 40);
  const pageSafe = Math.max(1, Math.floor(page));
  // Puxa um pouco a mais — probe de capa descarta alguns
  const fetchCount = Math.min(capped + 12, 40);
  const startIndex = (pageSafe - 1) * capped;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", String(fetchCount));
  url.searchParams.set("startIndex", String(startIndex));
  url.searchParams.set("printType", "books");
  url.searchParams.set("orderBy", "relevance");

  const res = await fetchGoogleBooks(url);
  if (res.status === 429 || res.status === 403) {
    throw new Error(`Google Books ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Google Books respondeu ${res.status}`);
  }

  const data = (await res.json()) as GoogleListResponse;
  if (data.error?.code) {
    throw new Error(`Google Books ${data.error.code}`);
  }

  const mapped = (data.items ?? [])
    .map(mapVolume)
    .filter((v): v is GoogleVolumeLite => v !== null);

  const ranked = rankVolumes(mapped, preparedQ);
  return withVerifiedCovers(ranked, capped);
}

export async function getGoogleBookVolume(
  volumeId: string,
): Promise<GoogleVolumeLite | null> {
  const id = volumeId.replace(/^gb:/i, "").trim();
  if (!id) return null;

  const url = new URL(
    `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}`,
  );
  const res = await fetchGoogleBooks(url);
  if (res.status === 404) return null;
  if (res.status === 429 || res.status === 403) {
    throw new Error(`Google Books ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Google Books respondeu ${res.status}`);
  }
  const data = (await res.json()) as GoogleVolume;
  if ((data as GoogleListResponse).error?.code) {
    throw new Error(`Google Books ${(data as GoogleListResponse).error!.code}`);
  }
  const mapped = mapVolume(data);
  if (!mapped) return null;
  const coverUrl = await resolveGoogleVolumeCover({
    id: mapped.id,
    isbn: mapped.isbn,
    fallbackThumb: mapped.coverUrl,
  });
  return { ...mapped, coverUrl };
}
