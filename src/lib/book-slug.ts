/** Slug Letterboxd-like. O ID da Open Library no sufixo impede colisão. */

const OL_SUFFIX = /(?:^|-)(ol\d+[wm])$/i;

export function slugifySegment(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function compactOlId(key: string): string | null {
  const match = key.match(/OL\d+[WM]/i);
  return match ? match[0].toLowerCase() : null;
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
  const id = compactOlId(input.key);
  if (!id) {
    const fallback = slugifySegment(input.title);
    return fallback || "livro";
  }
  const title = slugifySegment(input.title) || "livro";
  return `${title}-${id}`;
}

export function parseBookSlug(slug: string): { olId: string } | null {
  const trimmed = slug.trim().toLowerCase();
  const suffix = trimmed.match(OL_SUFFIX);
  if (suffix) return { olId: suffix[1] };
  if (/^ol\d+[wm]$/.test(trimmed)) return { olId: trimmed };
  return null;
}
