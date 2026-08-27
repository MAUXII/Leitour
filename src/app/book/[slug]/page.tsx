import { notFound, permanentRedirect } from "next/navigation";
import { BookStage } from "@/components/books/book-stage";
import { bookSlug, parseBookSlug } from "@/lib/book-slug";
import { getCatalogWork } from "@/lib/catalog";
import { APP_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps) {
  const parsed = parseBookSlug(params.slug);
  if (!parsed) return { title: APP_NAME };
  try {
    const work = await getCatalogWork(parsed.id);
    if (!work) return { title: APP_NAME };
    const authors = work.authors.join(", ");
    return {
      title: authors ? `${work.title} · ${authors}` : work.title,
      description: work.description?.slice(0, 160),
    };
  } catch {
    return { title: APP_NAME };
  }
}

export default async function BookPage({ params }: PageProps) {
  const parsed = parseBookSlug(params.slug);
  if (!parsed) notFound();

  let work;
  try {
    work = await getCatalogWork(parsed.id);
  } catch {
    notFound();
  }
  if (!work) notFound();

  const canonical = bookSlug(work);
  if (canonical !== params.slug) {
    permanentRedirect(routes.book(canonical));
  }

  return <BookStage work={work} />;
}
