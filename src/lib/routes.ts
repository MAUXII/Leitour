export const routes = {
  home: "/",
  feed: "/feed",
  books: "/books",
  booksSearch: (q: string) => `/books?q=${encodeURIComponent(q)}`,
  book: (slug: string) => `/book/${slug}`,
  discover: "/discover",
  profile: "/profile",
  saved: "/saved",
  publish: "/publish",
  publishBook: (input: {
    title: string;
    key?: string;
    coverUrl?: string;
    authors?: string[];
  }) => {
    const params = new URLSearchParams();
    params.set("title", input.title);
    if (input.key) params.set("key", input.key);
    if (input.coverUrl) params.set("cover", input.coverUrl);
    if (input.authors?.length) params.set("authors", input.authors.join(", "));
    return `/publish?${params.toString()}`;
  },
  login: "/auth/login",
  signup: "/auth/signup",
  onboarding: "/auth/onboarding",
} as const;

export function isBookPath(pathname: string | null | undefined) {
  return !!pathname && (pathname === "/book" || pathname.startsWith("/book/"));
}
