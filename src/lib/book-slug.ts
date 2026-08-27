/** Slug Letterboxd-like. Sufixo: Hardcover (`hc-…`), Google (`gb-…`) ou Open Library (`ol…`). */

const OL_SUFFIX = /(?:^|-)(ol\d+[wm])$/i;
const GB_SUFFIX = /(?:^|-)gb-([A-Za-z0-9_-]+)$/;
const HC_SUFFIX = /(?:^|-)hc-(\d+)$/i;

function slugifySegment(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function compactOlId(key: string): string | null {
  const match = key.match(/OL\d+[WM]/i);
  return match ? match[0].toLowerCase() : null;
}

function compactGbId(key: string): string | null {
  const m = key.match(/^gb:(.+)$/i) || key.match(/^\/?gb\/(.+)$/i);
  if (m?.[1]) return m[1].trim();
  return null;
}

function compactHcId(key: string): string | null {
  const m = key.match(/^hc:(\d+)$/i);
  return m?.[1] ?? null;
}

export function olPathFromId(id: string): string {
  const match = id.match(/ol(\d+)([wm])/i);
  if (!match) return `/works/${id.replace(/^\/works\//i, "")}`;
  const num = match[1];
  return match[2].toLowerCase() === "w"
    ? `/works/OL${num}W`
    : `/books/OL${num}M`;
}

export function bookSlug(input: { key: string; title: string }): string {
  const title = slugifySegment(input.title) || "livro";
  const hc = compactHcId(input.key);
  if (hc) return `${title}-hc-${hc}`;
  const gb = compactGbId(input.key);
  if (gb) return `${title}-gb-${gb}`;
  const ol = compactOlId(input.key);
  if (ol) return `${title}-${ol}`;
  return title;
}

/** id canônico: `hc:123`, `gb:volumeId` ou `ol123w`. */
export function parseBookSlug(slug: string): { id: string } | null {
  const trimmed = slug.trim();
  const hc = trimmed.match(HC_SUFFIX);
  if (hc) return { id: `hc:${hc[1]}` };
  if (/^hc-\d+$/i.test(trimmed)) {
    return { id: `hc:${trimmed.slice(3)}` };
  }
  const gb = trimmed.match(GB_SUFFIX);
  if (gb) return { id: `gb:${gb[1]}` };
  if (/^gb-[A-Za-z0-9_-]+$/i.test(trimmed)) {
    return { id: `gb:${trimmed.slice(3)}` };
  }
  const lower = trimmed.toLowerCase();
  const ol = lower.match(OL_SUFFIX);
  if (ol) return { id: ol[1]! };
  if (/^ol\d+[wm]$/.test(lower)) return { id: lower };
  return null;
}
