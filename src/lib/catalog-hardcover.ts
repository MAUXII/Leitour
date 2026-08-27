/**
 * Hardcover GraphQL — 1ª fonte do catálogo.
 * Docs: https://docs.hardcover.app/api/getting-started/
 *
 * Minimização de quota (Free: 5k/dia, burst 10, 60/min):
 * - 1 search = 1 request; hits já trazem capa/autor/ano (sem N+1)
 * - unstable_cache + memo in-process
 * - circuit breaker em 429 → cai pra Google/OL
 * - subject:/gênero também usa HC (1 search por página)
 * - cover picker continua em GB/OL (não gasta HC)
 */

import { unstable_cache } from "next/cache";

const ENDPOINT = "https://api.hardcover.app/v1/graphql";
const UA = "Leitour/1.0 (catalog; hardcover)";

/** Cache Next (segundos). */
const REVALIDATE_SEARCH = 60 * 60; // 1h
const REVALIDATE_BOOK = 60 * 60 * 24; // 24h

/** Memo in-process — dedupe na mesma instância. */
const MEMO_TTL_MS = 10 * 60 * 1000;
const memo = new Map<string, { at: number; value: unknown }>();

let pausedUntil = 0;

export type HardcoverBookLite = {
  id: number;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  isbn?: string;
  description?: string;
  subjects: string[];
  slug?: string;
};

export function hardcoverConfigured(): boolean {
  return Boolean(apiToken());
}

export function hardcoverPaused(): boolean {
  return Date.now() < pausedUntil;
}

function apiToken(): string | undefined {
  const raw = process.env.HARDCOVER_API_TOKEN?.trim();
  if (!raw) return undefined;
  return raw.replace(/^Bearer\s+/i, "").trim() || undefined;
}

function memoGet<T>(key: string): T | undefined {
  const hit = memo.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > MEMO_TTL_MS) {
    memo.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function memoSet(key: string, value: unknown) {
  memo.set(key, { at: Date.now(), value });
  // Cap simples
  if (memo.size > 400) {
    const first = memo.keys().next().value;
    if (first) memo.delete(first);
  }
}

function pauseFromHeaders(res: Response) {
  const retry = res.headers.get("Retry-After");
  const sec = retry ? Number(retry) : 60;
  const wait = Number.isFinite(sec) && sec > 0 ? sec : 60;
  pausedUntil = Date.now() + wait * 1000;
}

type GqlResponse = {
  data?: Record<string, unknown>;
  errors?: Array<{ message?: string }>;
};

async function hardcoverGraphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; status: number }> {
  if (hardcoverPaused()) {
    throw new Error("Hardcover pausado (rate limit)");
  }
  const token = apiToken();
  if (!token) {
    throw new Error("HARDCOVER_API_TOKEN ausente");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "user-agent": UA,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store", // POST: cache via unstable_cache / memo
  });

  if (res.status === 429 || res.status === 503) {
    pauseFromHeaders(res);
    throw new Error(`Hardcover ${res.status}`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Hardcover ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Hardcover respondeu ${res.status}`);
  }

  const json = (await res.json()) as GqlResponse;
  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).filter(Boolean).join("; ");
    if (/throttl|rate|too many/i.test(msg)) {
      pausedUntil = Date.now() + 60_000;
    }
    throw new Error(msg || "Hardcover GraphQL error");
  }
  return { data: json.data ?? null, status: res.status };
}

function coverFromUnknown(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string" && raw.startsWith("http")) return raw;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (typeof o.url === "string" && o.url.startsWith("http")) return o.url;
    if (typeof o.image === "string" && o.image.startsWith("http")) return o.image;
  }
  return undefined;
}

function authorsFromHit(hit: Record<string, unknown>): string[] {
  if (Array.isArray(hit.author_names)) {
    return hit.author_names
      .map((a) => (typeof a === "string" ? a.trim() : ""))
      .filter(Boolean);
  }
  if (Array.isArray(hit.contributions)) {
    return hit.contributions
      .map((c) => {
        const author = (c as { author?: { name?: string } })?.author?.name;
        return author?.trim() || "";
      })
      .filter(Boolean);
  }
  const cached = hit.cached_contributors;
  if (Array.isArray(cached)) {
    return cached
      .map((c) => {
        const row = c as { author?: { name?: string }; name?: string };
        return row.author?.name?.trim() || row.name?.trim() || "";
      })
      .filter(Boolean);
  }
  return [];
}

function yearFromHit(hit: Record<string, unknown>): number | undefined {
  if (typeof hit.release_year === "number") return hit.release_year;
  if (typeof hit.release_date === "string") {
    const m = hit.release_date.match(/\d{4}/);
    if (m) return Number(m[0]);
  }
  return undefined;
}

function isbnFromHit(hit: Record<string, unknown>): string | undefined {
  if (Array.isArray(hit.isbns) && hit.isbns.length) {
    const first = hit.isbns.find((x) => typeof x === "string") as
      | string
      | undefined;
    if (first) return first.replace(/[-\s]/g, "");
  }
  if (typeof hit.isbn_13 === "string") return hit.isbn_13.replace(/[-\s]/g, "");
  if (typeof hit.isbn_10 === "string") return hit.isbn_10.replace(/[-\s]/g, "");
  return undefined;
}

function subjectsFromHit(hit: Record<string, unknown>): string[] {
  if (Array.isArray(hit.genres)) {
    return hit.genres
      .map((g) => (typeof g === "string" ? g : (g as { name?: string })?.name))
      .filter((g): g is string => !!g)
      .slice(0, 3);
  }
  const tags = hit.cached_tags as { Genre?: Array<{ tag?: string; name?: string }> } | undefined;
  if (tags?.Genre?.length) {
    return tags.Genre.map((t) => t.tag || t.name || "")
      .filter(Boolean)
      .slice(0, 3);
  }
  return [];
}

function mapHit(raw: unknown): HardcoverBookLite | null {
  if (!raw || typeof raw !== "object") return null;
  let hit = raw as Record<string, unknown>;
  // Typesense-style: { document: {...} }
  if (hit.document && typeof hit.document === "object") {
    hit = hit.document as Record<string, unknown>;
  }
  const id = typeof hit.id === "number" ? hit.id : Number(hit.id);
  const title = typeof hit.title === "string" ? hit.title.trim() : "";
  if (!Number.isFinite(id) || id <= 0 || !title) return null;

  const coverUrl =
    coverFromUnknown(hit.image) ||
    coverFromUnknown(hit.cached_image) ||
    (typeof hit.cover === "string" ? hit.cover : undefined) ||
    (typeof hit.image_url === "string" ? hit.image_url : undefined);

  const description =
    typeof hit.description === "string" ? hit.description.trim() : undefined;

  return {
    id,
    title,
    authors: authorsFromHit(hit),
    year: yearFromHit(hit),
    coverUrl,
    isbn: isbnFromHit(hit),
    description: description || undefined,
    subjects: subjectsFromHit(hit),
    slug: typeof hit.slug === "string" ? hit.slug : undefined,
  };
}

function extractHits(results: unknown): unknown[] {
  if (!results) return [];
  if (Array.isArray(results)) return results;
  if (typeof results !== "object") return [];
  const o = results as Record<string, unknown>;
  if (Array.isArray(o.hits)) return o.hits;
  if (Array.isArray(o.books)) return o.books;
  return [];
}

/** Query de busca → string pra Typesense do HC. */
export function toHardcoverSearchQuery(preparedQ: string): string | null {
  const raw = preparedQ.trim().replace(/\*$/, "");
  if (!raw) return null;

  // Chips subject:Fantasy → busca "Fantasy" (HC indexa genres)
  const subject = raw.match(/^subject:(?:"([^"]+)"|(.+))$/i);
  if (subject) {
    return (subject[1] ?? subject[2] ?? "").trim().split("/")[0]!.trim() || null;
  }

  const isbn = raw.match(/^isbn:(.+)$/i);
  if (isbn) return isbn[1]!.replace(/[-\s]/g, "");

  const author = raw.match(/^(?:author|inauthor):(?:"([^"]+)"|(.+))$/i);
  if (author) return (author[1] ?? author[2] ?? "").trim();

  const title = raw.match(/^(?:title|intitle):(?:"([^"]+)"|(.+))$/i);
  if (title) return (title[1] ?? title[2] ?? "").trim();

  return raw;
}

const SEARCH_QUERY = `
query SearchBooks($q: String!, $perPage: Int!, $page: Int!) {
  search(
    query: $q
    query_type: "Book"
    per_page: $perPage
    page: $page
    sort: "activities_count:desc"
  ) {
    results
  }
}
`;

async function searchHardcoverBooksFresh(
  q: string,
  capped: number,
  page: number,
): Promise<HardcoverBookLite[]> {
  const { data } = await hardcoverGraphql(SEARCH_QUERY, {
    q,
    perPage: capped,
    page,
  });

  const search = data?.search as { results?: unknown } | undefined;
  const hits = extractHits(search?.results);
  const mapped = hits
    .map(mapHit)
    .filter((b): b is HardcoverBookLite => b !== null)
    .slice(0, capped);

  const withCover = mapped.filter((b) => !!b.coverUrl);
  return withCover.length > 0 ? withCover : mapped;
}

export async function searchHardcoverBooks(
  preparedQ: string,
  limit = 16,
  page = 1,
): Promise<HardcoverBookLite[]> {
  const q = toHardcoverSearchQuery(preparedQ);
  if (!q || !hardcoverConfigured() || hardcoverPaused()) return [];

  const capped = Math.min(Math.max(limit, 1), 20);
  const pageSafe = Math.max(1, Math.floor(page));
  const memoKey = `search:${q}:${capped}:${pageSafe}`;
  const cached = memoGet<HardcoverBookLite[]>(memoKey);
  if (cached) return cached;

  const cachedFn = unstable_cache(
    () => searchHardcoverBooksFresh(q, capped, pageSafe),
    ["hardcover-search", q, String(capped), String(pageSafe)],
    { revalidate: REVALIDATE_SEARCH },
  );

  const out = await cachedFn();
  memoSet(memoKey, out);
  return out;
}

const BOOK_BY_ID = `
query BookById($id: Int!) {
  books(where: { id: { _eq: $id } }, limit: 1) {
    id
    title
    description
    release_year
    release_date
    slug
    cached_image
    cached_contributors
    cached_tags
    image { url }
    contributions { author { name } }
    default_physical_edition {
      isbn_13
      isbn_10
    }
  }
}
`;

async function getHardcoverBookFresh(
  id: number,
): Promise<HardcoverBookLite | null> {
  const { data } = await hardcoverGraphql(BOOK_BY_ID, { id });

  const rows = data?.books as unknown[] | undefined;
  const row = rows?.[0];
  if (!row || typeof row !== "object") return null;

  const book = row as Record<string, unknown>;
  const edition = book.default_physical_edition as
    | { isbn_13?: string; isbn_10?: string }
    | undefined;

  const hit: Record<string, unknown> = {
    ...book,
    isbn_13: edition?.isbn_13,
    isbn_10: edition?.isbn_10,
    image: book.image ?? book.cached_image,
  };

  return mapHit(hit);
}

export async function getHardcoverBook(
  bookId: string | number,
): Promise<HardcoverBookLite | null> {
  const id = Number(String(bookId).replace(/^hc:/i, ""));
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!hardcoverConfigured() || hardcoverPaused()) return null;

  const memoKey = `book:${id}`;
  const cached = memoGet<HardcoverBookLite | null>(memoKey);
  if (cached !== undefined) return cached;

  const cachedFn = unstable_cache(
    () => getHardcoverBookFresh(id),
    ["hardcover-book", String(id)],
    { revalidate: REVALIDATE_BOOK },
  );

  const mapped = await cachedFn();
  memoSet(memoKey, mapped);
  return mapped;
}
