export const routes = {
  home: "/",
  feed: "/feed",
  books: "/books",
  booksSearch: (q: string) => `/books?q=${encodeURIComponent(q)}`,
  book: (slug: string) => `/book/${slug}`,
  discover: "/discover",
  profile: "/profile",
  saved: "/saved",
  /** Query string: diálogo de publicar aberto (`?publish=1`). */
  publish: "/feed?publish=1",
  publishBook: (
    input: {
      title: string;
      key?: string;
      coverUrl?: string;
      authors?: string[];
    },
    pathname = "/feed",
  ) => {
    const params = new URLSearchParams();
    params.set("publish", "1");
    params.set("title", input.title);
    if (input.key) params.set("key", input.key);
    if (input.coverUrl) params.set("cover", input.coverUrl);
    if (input.authors?.length) params.set("authors", input.authors.join(", "));
    const base = pathname.split("?")[0] || "/feed";
    return `${base}?${params.toString()}`;
  },
  login: "/auth/login",
  signup: "/auth/signup",
  onboarding: "/auth/onboarding",
} as const;

export const PUBLISH_QUERY_KEYS = [
  "publish",
  "title",
  "key",
  "cover",
  "authors",
] as const;

export function isPublishOpen(searchParams: URLSearchParams): boolean {
  const v = searchParams.get("publish");
  return v === "1" || v === "true" || v === "";
}

export function isBookPath(pathname: string | null | undefined) {
  return !!pathname && (pathname === "/book" || pathname.startsWith("/book/"));
}
