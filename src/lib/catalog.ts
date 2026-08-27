import { olPathFromId } from "@/lib/book-slug";
import {
  getGoogleBookVolume,
  searchGoogleBooks,
} from "@/lib/catalog-google";
import {
  getHardcoverBook,
  hardcoverConfigured,
  searchHardcoverBooks,
  toHardcoverSearchQuery,
} from "@/lib/catalog-hardcover";

export type CatalogBook = {
  key: string;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  isbn?: string;
};

/** Mínimo pra busca (Google tolera curto; OL ainda é fallback). */
export const OL_MIN_QUERY_CHARS = 3;

const BLOCKED_QUERIES = new Set(["the"]);

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

  if (BLOCKED_QUERIES.has(q.toLowerCase())) {
    return { ok: false, reason: "blocked" };
  }

  if (q.length < 2) return { ok: false, reason: "short" };

  if (/^subject:/i.test(q)) {
    return { ok: true, q, sort: "editions" };
  }

  if (/^(?:author|inauthor|title|intitle|isbn):/i.test(q)) {
    return { ok: true, q };
  }

  return { ok: true, q };
}

/** Busca por subject (`subject:horror` / `subject:"horror fiction"`). */
export function subjectSearchQuery(subject: string): string {
  const primary = subject.trim().split("/")[0]!.trim().replace(/"/g, "");
  if (!primary) return "";
  if (/\s/.test(primary)) return `subject:"${primary}"`;
  return `subject:${primary}`;
}

export function formatSubjectLabel(subject: string): string {
  return subject
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseSubjectNeedle(q: string): string | null {
  const m = q.trim().match(/^subject:(?:"([^"]+)"|(.+))$/i);
  const value = (m?.[1] ?? m?.[2])?.trim();
  return value || null;
}

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

async function searchOpenLibraryBooks(
  preparedQ: string,
  sort: "editions" | undefined,
  limit: number,
  page = 1,
): Promise<CatalogBook[]> {
  const subjectNeedle = parseSubjectNeedle(preparedQ);
  const capped = Math.min(Math.max(limit, 1), 40);
  const pageSafe = Math.max(1, Math.floor(page));
  const fetchLimit = subjectNeedle
    ? Math.min(Math.max(capped * 3, 40), 80)
    : capped;

  let q = preparedQ;
  if (!subjectNeedle && !/^isbn:/i.test(q) && q.length < OL_MIN_QUERY_CHARS) {
    q = `${q}*`;
  }

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(fetchLimit));
  url.searchParams.set("page", String(pageSafe));
  url.searchParams.set(
    "fields",
    subjectNeedle
      ? "key,title,author_name,first_publish_year,cover_i,isbn,subject"
      : "key,title,author_name,first_publish_year,cover_i,isbn",
  );
  if (sort) url.searchParams.set("sort", sort);

  const res = await fetchOpenLibrary(url);
  if (res.status === 422) return [];
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status}`);

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

export type CatalogSearchPage = {
  books: CatalogBook[];
  hasMore: boolean;
};

function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeIsbn(isbn?: string): string | null {
  if (!isbn) return null;
  const clean = isbn.replace(/[-\s]/g, "").toUpperCase();
  return clean.length >= 10 ? clean : null;
}

function bookFingerprint(book: CatalogBook): string {
  const isbn = normalizeIsbn(book.isbn);
  if (isbn) return `isbn:${isbn}`;
  const title = foldText(book.title);
  const author = foldText(book.authors[0] ?? "");
  return `ta:${title}|${author}`;
}

function titleRelevance(title: string, query: string): number {
  const q = foldText(
    query.replace(/^(?:intitle|inauthor|subject|isbn|author|title):/i, ""),
  );
  if (!q || /^subject\b/i.test(query.trim())) return 0;
  const t = foldText(title);
  if (!t) return 0;
  if (t === q) return 40;
  if (t.startsWith(q)) return 28;
  if (t.includes(q)) return 18;
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return 0;
  const hit = words.filter((w) => t.includes(w)).length;
  return Math.round((hit / words.length) * 14);
}

function mapHardcoverHit(b: {
  id: number;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  isbn?: string;
}): CatalogBook {
  return {
    key: `hc:${b.id}`,
    title: b.title,
    authors: b.authors,
    year: b.year,
    coverUrl: b.coverUrl,
    isbn: b.isbn,
  };
}

function mapGoogleHit(v: {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  isbn?: string;
}): CatalogBook {
  return {
    key: `gb:${v.id}`,
    title: v.title,
    authors: v.authors,
    year: v.year,
    coverUrl: v.coverUrl,
    isbn: v.isbn,
  };
}

/** Une HC + Google, dedupe por ISBN / título+autor, prioriza match de título. */
function mergeCatalogResults(
  hardcover: CatalogBook[],
  google: CatalogBook[],
  query: string,
  limit: number,
): CatalogBook[] {
  type Tagged = { book: CatalogBook; source: "hc" | "gb" };
  const tagged: Tagged[] = [
    ...hardcover.map((book) => ({ book, source: "hc" as const })),
    ...google.map((book) => ({ book, source: "gb" as const })),
  ];

  tagged.sort((a, b) => {
    const score = (item: Tagged) =>
      titleRelevance(item.book.title, query) +
      (item.book.coverUrl ? 3 : 0) +
      (item.source === "hc" ? 1 : 0) +
      (item.book.isbn ? 1 : 0);
    return score(b) - score(a);
  });

  const seen = new Set<string>();
  const out: CatalogBook[] = [];
  for (const { book } of tagged) {
    const fp = bookFingerprint(book);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push(book);
    if (out.length >= limit) break;
  }
  return out;
}

export async function searchCatalogBooks(
  query: string,
  limit = 16,
  page = 1,
): Promise<CatalogSearchPage> {
  const prepared = prepareCatalogQuery(query);
  if (!prepared.ok) return { books: [], hasMore: false };

  const want = Math.min(Math.max(limit, 1), 24);
  const pageSafe = Math.max(1, Math.floor(page));

  const runHc =
    hardcoverConfigured() && Boolean(toHardcoverSearchQuery(prepared.q));

  // Hardcover + Google em paralelo — não fica preso se o HC devolver lixo/parcial
  const [hcSettled, gbSettled] = await Promise.allSettled([
    runHc
      ? searchHardcoverBooks(prepared.q, want, pageSafe)
      : Promise.resolve([] as Awaited<ReturnType<typeof searchHardcoverBooks>>),
    searchGoogleBooks(prepared.q, want, pageSafe),
  ]);

  const hcBooks =
    hcSettled.status === "fulfilled"
      ? hcSettled.value.map(mapHardcoverHit)
      : [];
  const gbBooks =
    gbSettled.status === "fulfilled"
      ? gbSettled.value.map(mapGoogleHit)
      : [];

  if (hcBooks.length > 0 || gbBooks.length > 0) {
    const books = mergeCatalogResults(hcBooks, gbBooks, prepared.q, want);
    const hasMore =
      (hcSettled.status === "fulfilled" &&
        hcSettled.value.length >= want) ||
      (gbSettled.status === "fulfilled" && gbSettled.value.length >= want);
    return { books, hasMore };
  }

  // Fallback Open Library se ambos falharem / vazios
  const ol = await searchOpenLibraryBooks(
    prepared.q,
    prepared.sort,
    want,
    pageSafe,
  );
  return { books: ol, hasMore: ol.length >= want };
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

  cleaned = cleaned
    .split(/\n-{2,}\n|\nAlso contained in:?\n/i)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned || undefined;
}

function pickSubjects(subjects: string[] | undefined, max = 3): string[] {
  if (!subjects?.length) return [];
  const scored = subjects
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.length <= 28)
    .filter((s) => !/backstor|property|authors$/i.test(s));
  const unique = Array.from(new Set(scored.map((s) => s.toLowerCase()))).map(
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
  const unique = Array.from(new Set(keys)).slice(0, 4);
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

async function getOpenLibraryWork(olId: string): Promise<CatalogWork | null> {
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

/** Aceita `hc:id`, `gb:volumeId` ou id Open Library (`ol123w` / path). */
export async function getCatalogWork(
  catalogId: string,
): Promise<CatalogWork | null> {
  if (/^hc:/i.test(catalogId)) {
    const book = await getHardcoverBook(catalogId);
    if (!book) return null;
    return {
      key: `hc:${book.id}`,
      title: book.title,
      authors: book.authors,
      year: book.year,
      coverUrl: book.coverUrl,
      isbn: book.isbn,
      description: book.description
        ? clipDescription(book.description, 1200)
        : undefined,
      subjects: pickSubjects(book.subjects, 3),
    };
  }

  if (/^gb:/i.test(catalogId)) {
    const vol = await getGoogleBookVolume(catalogId);
    if (!vol) return null;
    return {
      key: `gb:${vol.id}`,
      title: vol.title,
      authors: vol.authors,
      year: vol.year,
      coverUrl: vol.coverUrl,
      isbn: vol.isbn,
      description: vol.description
        ? clipDescription(vol.description, 1200)
        : undefined,
      subjects: pickSubjects(vol.subjects, 3),
    };
  }
  return getOpenLibraryWork(catalogId);
}
