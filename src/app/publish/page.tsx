import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

/** Legado: /publish → /feed?publish=1 (+ params do livro). */
export default function PublishRedirectPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();
  params.set("publish", "1");
  for (const key of ["title", "key", "cover", "authors"] as const) {
    const raw = searchParams[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) params.set(key, value);
  }
  redirect(`${routes.feed.split("?")[0]}?${params.toString()}`);
}
