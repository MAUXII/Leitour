import { BooksCatalog } from "@/components/books/books-catalog";

type PageProps = {
  searchParams: { q?: string };
};

export default function BooksPage({ searchParams }: PageProps) {
  return <BooksCatalog initialQuery={searchParams.q?.trim() ?? ""} />;
}
