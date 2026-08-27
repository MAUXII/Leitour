import { authorSlug } from "@/lib/author-slug";
import { openPublishHref } from "@/lib/publish-session";

export const routes = {
  home: "/",
  feed: "/feed",
  books: "/books",
  booksSearch: (q: string) => `/books?q=${encodeURIComponent(q)}`,
  book: (slug: string) => `/book/${slug}`,
  author: (name: string) => {
    const slug = authorSlug(name) || "autor";
    return `/author/${slug}?name=${encodeURIComponent(name.trim())}`;
  },
  discover: "/discover",
  profile: "/profile",
  settings: "/settings",
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

/** Páginas com wash de capa/foto — chrome claro não reverte text-white. */
export function isAtmospherePath(pathname: string | null | undefined) {
  if (!pathname) return false;
  if (isBookPath(pathname)) return true;
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;
  return false;
}
