/** Slug de autor a partir do nome exibido no catálogo. */

export function authorSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Fallback quando a URL não traz `?name=` — só aproximação. */
export function authorNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function authorSearchQuery(name: string): string {
  const n = name.trim().replace(/"/g, "");
  if (!n) return "";
  return /\s/.test(n) ? `inauthor:"${n}"` : `inauthor:${n}`;
}
