import { openPublishHref } from "@/lib/publish-session";

export const routes = {
  home: "/",
  feed: "/feed",
  books: "/books",
  booksSearch: (q: string) => `/books?q=${encodeURIComponent(q)}`,
  book: (slug: string) => `/book/${slug}`,
  discover: "/discover",
  profile: "/profile",
  saved: "/saved",
  /** Abre o diálogo de publicar no feed. */
  publish: openPublishHref(),
  publishBook: openPublishHref,
  login: "/auth/login",
  signup: "/auth/signup",
  onboarding: "/auth/onboarding",
} as const;

export function isBookPath(pathname: string | null | undefined) {
  return !!pathname && (pathname === "/book" || pathname.startsWith("/book/"));
}
