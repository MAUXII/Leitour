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
  publishBook: (title: string) =>
    `/publish?title=${encodeURIComponent(title)}`,
  login: "/auth/login",
  signup: "/auth/signup",
  onboarding: "/auth/onboarding",
} as const;

export function isBookPath(pathname: string | null | undefined) {
  return !!pathname && (pathname === "/book" || pathname.startsWith("/book/"));
}
