import { filterUsableCovers } from "@/lib/catalog-cover-quality";
import { olPathFromId } from "@/lib/book-slug";
import {
  getGoogleBookVolume,
  searchGoogleBooks,
} from "@/lib/catalog-google";

export type CoverCandidateInput = {
  key: string;
  title: string;
  authors: string[];
  isbn?: string;
  currentCoverUrl?: string;
};

/** Fingerprint pra dedupe (mesma capa em zooms/tamanhos diferentes). */
function coverFingerprint(url: string): string {
  const ol = url.match(/covers\.openlibrary\.org\/b\/id\/(\d+)/i);
  if (ol) return `ol:${ol[1]}`;
  const isbn = url.match(/covers\.openlibrary\.org\/b\/isbn\/([^/?#]+)/i);
  if (isbn) return `ol-isbn:${isbn[1].toLowerCase()}`;
  const gb = url.match(/[?&]id=([^&]+)/i);
  if (gb && /books\.google|googleusercontent/i.test(url)) {
    return `gb:${decodeURIComponent(gb[1]!)}`;
  }
  return url.replace(/^http:/i, "https:").split("&zoom=")[0]!.toLowerCase();
}

function pushUnique(out: string[], seen: Set<string>, url?: string) {
  if (!url) return;
  const https = url.replace(/^http:/i, "https:");
  const fp = coverFingerprint(https);
  if (seen.has(fp)) return;
  seen.add(fp);
  out.push(https);
}

async function candidatesFromGoogle(
  input: CoverCandidateInput,
): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();
  const title = input.title.trim();

  if (/^gb:/i.test(input.key)) {
    try {
      const vol = await getGoogleBookVolume(input.key);
      if (vol?.coverUrl) pushUnique(out, seen, vol.coverUrl);
    } catch {
      /* ignore */
    }
  }

  // prepareCatalogQuery / toGoogleBooksQuery: isbn:… ou título puro → intitle:
  const queries: string[] = [];
  if (input.isbn) queries.push(`isbn:${input.isbn}`);
  if (title) queries.push(title);

  for (const q of queries) {
    try {
      const vols = await searchGoogleBooks(q, 20);
      for (const v of vols) {
        const t = v.title.toLowerCase();
        const want = title.toLowerCase();
        if (
          want &&
          !t.includes(want.slice(0, Math.min(want.length, 12))) &&
          !want.includes(t.slice(0, Math.min(t.length, 12)))
        ) {
          continue;
        }
        pushUnique(out, seen, v.coverUrl);
      }
    } catch {
      /* ignore */
    }
    if (out.length >= 12) break;
  }

  return out;
}

async function candidatesFromOpenLibrary(
  input: CoverCandidateInput,
): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();

  if (input.isbn) {
    pushUnique(
      out,
      seen,
      `https://covers.openlibrary.org/b/isbn/${input.isbn}-L.jpg`,
    );
  }

  let workPath: string | null = null;
  if (/^gb:/i.test(input.key)) {
    // Google-only book: try OL by ISBN / title
  } else {
    try {
      const path = olPathFromId(input.key);
      if (path.startsWith("/works/")) workPath = path;
      else {
        const res = await fetch(`https://openlibrary.org${path}.json`, {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const edition = (await res.json()) as {
            works?: Array<{ key?: string }>;
            covers?: number[];
          };
          for (const id of edition.covers ?? []) {
            if (id > 0) {
              pushUnique(
                out,
                seen,
                `https://covers.openlibrary.org/b/id/${id}-L.jpg`,
              );
            }
          }
          workPath = edition.works?.[0]?.key ?? null;
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!workPath && input.isbn) {
    try {
      const url = new URL("https://openlibrary.org/search.json");
      url.searchParams.set("isbn", input.isbn);
      url.searchParams.set("limit", "1");
      url.searchParams.set("fields", "key,cover_i");
      const res = await fetch(url.toString(), {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          docs?: Array<{ key?: string; cover_i?: number }>;
        };
        const doc = data.docs?.[0];
        if (doc?.cover_i) {
          pushUnique(
            out,
            seen,
            `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          );
        }
        if (doc?.key?.startsWith("/works/")) workPath = doc.key;
      }
    } catch {
      /* ignore */
    }
  }

  if (workPath) {
    try {
      const res = await fetch(`https://openlibrary.org${workPath}.json`, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const work = (await res.json()) as { covers?: number[] };
        for (const id of work.covers ?? []) {
          if (id > 0) {
            pushUnique(
              out,
              seen,
              `https://covers.openlibrary.org/b/id/${id}-L.jpg`,
            );
          }
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const url = new URL(`https://openlibrary.org${workPath}/editions.json`);
      url.searchParams.set("limit", "20");
      const res = await fetch(url.toString(), {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          entries?: Array<{ covers?: number[] }>;
        };
        for (const entry of data.entries ?? []) {
          for (const id of entry.covers ?? []) {
            if (id > 0) {
              pushUnique(
                out,
                seen,
                `https://covers.openlibrary.org/b/id/${id}-L.jpg`,
              );
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return out;
}

/** Junta candidatas Google + Open Library (edições diferentes = capas diferentes). */
export async function listCoverCandidates(
  input: CoverCandidateInput,
): Promise<string[]> {
  const seen = new Set<string>();
  const out: string[] = [];
  pushUnique(out, seen, input.currentCoverUrl);

  const [google, ol] = await Promise.all([
    candidatesFromGoogle(input),
    candidatesFromOpenLibrary(input),
  ]);

  for (const url of [...google, ...ol]) {
    pushUnique(out, seen, url);
    if (out.length >= 28) break;
  }

  return filterUsableCovers(out, 18);
}
