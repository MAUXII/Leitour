import { olPathFromId } from "@/lib/book-slug";

export type CatalogBook = {
  key: string;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  isbn?: string;
};

/** Open Library recusa `q` com < 3 chars (HTTP 422). */
export const OL_MIN_QUERY_CHARS = 3;

const OL_BLOCKED_QUERIES = new Set(["the"]);

export type CatalogQueryPrep =
  | { ok: true; q: string; sort?: "editions" }
  | { ok: false; reason: "empty" | "short" | "blocked" };

export function prepareCatalogQuery(raw: string): CatalogQueryPrep {
  const q = raw.trim();
  if (!q) return { ok: false, reason: "empty" };

  const isbn = q.replace(/[-\s]/g, "");
  if (/^\d{9}[\dXx]$/i.test(isbn) || /^\d{13}$/.test(isbn)) {
    return { ok: true, q: `isbn:${isbn}` };
  }

  if (OL_BLOCKED_QUERIES.has(q.toLowerCase())) {
    return { ok: false, reason: "blocked" };
  }

  if (q.length < 2) return { ok: false, reason: "short" };

  // 2 letras: prefixo `it*` vira 3 chars e passa na validação da OL.
  if (q.length < OL_MIN_QUERY_CHARS) {
    return { ok: true, q: `${q}*`, sort: "editions" };
  }

  // Subject: ordenar por nº de edições ≈ obras mais conhecidas primeiro.
  if (/^subject:/i.test(q)) {
    return { ok: true, q, sort: "editions" };
  }

  return { ok: true, q };
}

/** Busca por subject na Open Library (`subject:horror` / `subject:"horror fiction"`). */
export function subjectSearchQuery(subject: string): string {
  const s = subject.trim().replace(/"/g, "");
  if (!s) return "";
  if (/\s/.test(s)) return `subject:"${s}"`;
  return `subject:${s}`;
}

export function formatSubjectLabel(subject: string): string {
  return subject
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Extrai o rótulo de `subject:horror` / `subject:"horror fiction"`. */
function parseSubjectNeedle(q: string): string | null {
  const m = q.trim().match(/^subject:(?:"([^"]+)"|(.+))$/i);
  const value = (m?.[1] ?? m?.[2])?.trim();
  return value || null;
}

/**
 * A OL indexa subject de forma frouxa (ex.: "ships" casa "relationships").
 * Exigimos match de palavra/frase real no array de subjects.
 */
function docHasSubject(
  subjects: string[] | undefined,
  needle: string,
): boolean {
  if (!subjects?.length) return false;
  const n = needle.toLowerCase().trim();
  if (!n) return false;
  return subjects.some((raw) => {
    const s = raw.toLowerCase().trim();
    if (s === n) return true;
    if (n.includes(" ")) return s.includes(n);
    return s.split(/[^a-z0-9]+/).filter(Boolean).includes(n);
  });
}

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  subject?: string[];
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibraryDoc[];
};

function coverFromDoc(doc: OpenLibraryDoc): string | undefined {
  if (doc.cover_i) {
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  }
  const isbn = doc.isbn?.[0];
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  }
  return undefined;
}

function mapOpenLibraryDoc(doc: OpenLibraryDoc): CatalogBook | null {
  if (!doc.title || !doc.key) return null;
  return {
    key: doc.key,
    title: doc.title,
    authors: doc.author_name ?? [],
    year: doc.first_publish_year,
    coverUrl: coverFromDoc(doc),
    isbn: doc.isbn?.[0],
  };
}

async function fetchOpenLibrary(
  url: URL,
  revalidate = 300,
): Promise<Response> {
  const res = await fetch(url.toString(), {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (res.status >= 500) {
    return fetch(url.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  }
  return res;
}

export async function searchCatalogBooks(
  query: string,
  limit = 20,
): Promise<CatalogBook[]> {
  const prepared = prepareCatalogQuery(query);
  if (!prepared.ok) return [];

  const subjectNeedle = parseSubjectNeedle(prepared.q);
  const capped = Math.min(Math.max(limit, 1), 40);
  // Subject: pedimos mais docs porque filtramos match frouxo da OL depois.
  const fetchLimit = subjectNeedle
    ? Math.min(Math.max(capped * 3, 40), 80)
    : capped;

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", prepared.q);
  url.searchParams.set("limit", String(fetchLimit));
  url.searchParams.set(
    "fields",
    subjectNeedle
      ? "key,title,author_name,first_publish_year,cover_i,isbn,subject"
      : "key,title,author_name,first_publish_year,cover_i,isbn",
  );
  if (prepared.sort) url.searchParams.set("sort", prepared.sort);

  const res = await fetchOpenLibrary(url);

  // 422 = query inválida pra OL. Não vira erro vermelho na UI.
  if (res.status === 422) return [];

  if (!res.ok) {
    throw new Error(`Open Library respondeu ${res.status}`);
  }

  const data = (await res.json()) as OpenLibrarySearchResponse;
  let docs = data.docs ?? [];
  if (subjectNeedle) {
    docs = docs.filter((doc) => docHasSubject(doc.subject, subjectNeedle));
  }

  return docs
    .slice(0, capped)
    .map(mapOpenLibraryDoc)
    .filter((book): book is CatalogBook => book !== null);
}

export type CatalogWork = CatalogBook & {
  description?: string;
  subjects: string[];
};

type OpenLibraryText = string | { value?: string; type?: string };

type OpenLibraryWork = {
  key?: string;
  title?: string;
  description?: OpenLibraryText;
  covers?: number[];
  first_publish_date?: string;
  subjects?: string[];
  authors?: Array<{
    author?: { key?: string };
    key?: string;
  }>;
};

type OpenLibraryAuthor = {
  name?: string;
};

function textFromOl(value: OpenLibraryText | undefined): string | undefined {
  if (!value) return undefined;
  const raw = typeof value === "string" ? value : value.value;
  if (!raw) return undefined;

  let cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
    .replace(/<[^>]+>/g, "");

  // Lixo editorial da OL: "Also contained in", listas de omnibus, etc.
  cleaned = cleaned
    .split(/\n-{2,}\n|\nAlso contained in:?\n/i)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned || undefined;
}

/** Prefer subjects curtos/legíveis; a OL manda dezenas de tags ruidosas. */
function pickSubjects(subjects: string[] | undefined, max = 3): string[] {
  if (!subjects?.length) return [];
  const scored = subjects
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.length <= 28)
    .filter((s) => !/backstor|property|authors$/i.test(s));
  const unique = [...new Set(scored.map((s) => s.toLowerCase()))].map(
    (lower) => scored.find((s) => s.toLowerCase() === lower)!,
  );
  return unique.slice(0, max);
}

function yearFromDate(value?: string): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : undefined;
}

function coverFromId(coverId: number, size: "M" | "L"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

async function fetchAuthorNames(keys: string[]): Promise<string[]> {
  const unique = [...new Set(keys)].slice(0, 4);
  const names = await Promise.all(
    unique.map(async (key) => {
      const url = new URL(`https://openlibrary.org${key}.json`);
      const res = await fetchOpenLibrary(url, 3600);
      if (!res.ok) return null;
      const data = (await res.json()) as OpenLibraryAuthor;
      return data.name?.trim() || null;
    }),
  );
  return names.filter((name): name is string => !!name);
}

type OpenLibraryEdition = {
  works?: Array<{ key?: string }>;
  covers?: number[];
  isbn_13?: string[];
  isbn_10?: string[];
};

type OpenLibraryEditionsList = {
  entries?: OpenLibraryEdition[];
};

async function resolveWorkPath(olId: string): Promise<string | null> {
  const path = olPathFromId(olId);
  if (path.startsWith("/works/")) return path;

  const res = await fetchOpenLibrary(
    new URL(`https://openlibrary.org${path}.json`),
    3600,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status}`);
  const edition = (await res.json()) as OpenLibraryEdition;
  return edition.works?.[0]?.key ?? null;
}

async function extrasFromEditions(workKey: string): Promise<{
  coverId?: number;
  isbn?: string;
}> {
  const url = new URL(`https://openlibrary.org${workKey}/editions.json`);
  url.searchParams.set("limit", "4");
  const res = await fetchOpenLibrary(url, 3600);
  if (!res.ok) return {};
  const data = (await res.json()) as OpenLibraryEditionsList;
  for (const entry of data.entries ?? []) {
    const coverId = entry.covers?.find((id) => id > 0);
    const isbn = entry.isbn_13?.[0] ?? entry.isbn_10?.[0];
    if (coverId || isbn) return { coverId, isbn };
  }
  return {};
}

function clipDescription(text: string, max = 1800): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return `${cut.slice(0, at > 400 ? at : max).trim()}…`;
}

export async function getCatalogWork(
  olId: string,
): Promise<CatalogWork | null> {
  const workPath = await resolveWorkPath(olId);
  if (!workPath) return null;

  const res = await fetchOpenLibrary(
    new URL(`https://openlibrary.org${workPath}.json`),
    3600,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Open Library respondeu ${res.status}`);
  }

  const work = (await res.json()) as OpenLibraryWork;
  if (!work.title || !work.key) return null;

  const authorKeys = (work.authors ?? [])
    .map((entry) => entry.author?.key ?? entry.key)
    .filter((k): k is string => !!k && k.startsWith("/authors/"));

  const authors = await fetchAuthorNames(authorKeys);
  let coverId = work.covers?.find((id) => id > 0);
  let isbn: string | undefined;
  if (!coverId) {
    const extras = await extrasFromEditions(work.key);
    coverId = extras.coverId;
    isbn = extras.isbn;
  }

  const description = textFromOl(work.description);

  return {
    key: work.key,
    title: work.title,
    authors,
    year: yearFromDate(work.first_publish_date),
    coverUrl: coverId ? coverFromId(coverId, "L") : undefined,
    isbn,
    description: description ? clipDescription(description, 1200) : undefined,
    subjects: pickSubjects(work.subjects, 3),
  };
}
