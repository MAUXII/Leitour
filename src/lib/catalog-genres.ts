/** Gêneros curados → subject Google Books (categories costumam ser EN). */

export type CatalogGenre = {
  id: string;
  label: string;
  /** Valor passado em `subject:…` */
  subject: string;
};

export const CATALOG_GENRES: CatalogGenre[] = [
  { id: "fiction", label: "Ficção", subject: "Fiction" },
  { id: "fantasy", label: "Fantasia", subject: "Fantasy" },
  { id: "scifi", label: "Ficção científica", subject: "Science Fiction" },
  { id: "mystery", label: "Mistério", subject: "Mystery" },
  { id: "romance", label: "Romance", subject: "Romance" },
  { id: "horror", label: "Terror", subject: "Horror" },
  { id: "thriller", label: "Suspense", subject: "Thrillers" },
  { id: "philosophy", label: "Filosofia", subject: "Philosophy" },
  { id: "bio", label: "Biografia", subject: "Biography & Autobiography" },
  { id: "history", label: "História", subject: "History" },
  { id: "poetry", label: "Poesia", subject: "Poetry" },
  { id: "self", label: "Autoajuda", subject: "Self-Help" },
];

export function genreFromSubjectQuery(q: string): CatalogGenre | null {
  const m = q.trim().match(/^subject:(?:"([^"]+)"|(.+))$/i);
  const needle = (m?.[1] ?? m?.[2] ?? "").trim().toLowerCase();
  if (!needle) return null;
  return (
    CATALOG_GENRES.find((g) => g.subject.toLowerCase() === needle) ?? null
  );
}
