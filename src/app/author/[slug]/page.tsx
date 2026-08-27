import { AuthorBooks } from "@/components/books/author-books";
import {
  authorNameFromSlug,
  authorSlug,
} from "@/lib/author-slug";
import { APP_NAME } from "@/lib/brand";

type PageProps = {
  params: { slug: string };
  searchParams: { name?: string };
};

export function generateMetadata({ params, searchParams }: PageProps) {
  const name =
    searchParams.name?.trim() || authorNameFromSlug(params.slug) || "Autor";
  return {
    title: `${name} · ${APP_NAME}`,
    description: `Livros de ${name}`,
  };
}

export default function AuthorPage({ params, searchParams }: PageProps) {
  const fromQuery = searchParams.name?.trim();
  const name =
    fromQuery && authorSlug(fromQuery) === params.slug
      ? fromQuery
      : fromQuery || authorNameFromSlug(params.slug) || "Autor";

  return <AuthorBooks name={name} />;
}
