"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { MorphingInfinity } from "@/components/ui/morphing-infinity";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { authorSearchQuery } from "@/lib/author-slug";
import { bookSlug } from "@/lib/book-slug";
import { coverIndex } from "@/lib/cover-tint";
import { routes } from "@/lib/routes";

export function AuthorBooks({ name }: { name: string }) {
  const q = authorSearchQuery(name);
  const search = useCatalogSearch(q, {
    immediateQuery: q,
    limit: 16,
    debounceMs: 0,
  });

  const books = search.books;
  const pending = search.status === "loading";
  const error = search.error;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
            Autor
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-white">
            {name}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Livros em sua autoria no catálogo
          </p>
        </div>

        {pending ? (
          <div className="flex justify-center py-16">
            <MorphingInfinity className="h-9 w-9 text-white/40" />
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-300/80">{error}</p>
        ) : null}

        {!pending && !error && books.length === 0 ? (
          <p className="text-sm text-white/40">Nenhum livro encontrado.</p>
        ) : null}

        {books.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {books.map((book) => {
              const slug = bookSlug(book);
              return (
                <li key={book.key}>
                  <Link
                    href={routes.book(slug)}
                    data-snd="select"
                    className="group block"
                  >
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverUrl}
                        alt=""
                        className="aspect-[2/3] w-full rounded-lg object-cover transition group-hover:opacity-90"
                      />
                    ) : (
                      <div
                        className={`ff-cover-${coverIndex(book.key)} flex aspect-[2/3] w-full items-center justify-center rounded-lg`}
                      >
                        <BookOpen
                          className="h-7 w-7 text-white/20"
                          strokeWidth={1.25}
                        />
                      </div>
                    )}
                    <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-white/80 group-hover:text-white">
                      {book.title}
                    </p>
                    {book.year ? (
                      <p className="mt-0.5 text-[11px] text-white/35">
                        {book.year}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
