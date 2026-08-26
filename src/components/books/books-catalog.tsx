"use client";

import { BookOpen, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AddToShelfButton } from "@/components/books/add-to-shelf-button";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { MorphingInfinity } from "@/components/ui/morphing-infinity";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { bookSlug } from "@/lib/book-slug";
import { routes } from "@/lib/routes";

export function BooksCatalog({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const search = useCatalogSearch(query, { immediateQuery: initialQuery });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const books = search.books;
  const error = search.error;
  const pending = search.status === "loading";
  const queryOk = search.status !== "idle" && search.status !== "short";

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-white">
              Livros
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Catálogo via Open Library · estante no Firebase
            </p>
          </div>
          <Link
            href={routes.publish}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Adicionar
          </Link>
        </div>

        <LiquidGlass className="w-full rounded-2xl">
          <label className="flex h-12 w-full items-center gap-3 px-4">
            <Search
              className="h-4 w-4 shrink-0 text-white/35"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar título, autor, ISBN ou subject:…"
              className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
        </LiquidGlass>

        {error && <p className="text-sm text-red-300/90">{error}</p>}

        {queryOk && pending && books.length === 0 && !error && (
          <div className="flex items-center justify-center gap-3 py-10 text-white/40">
            <MorphingInfinity className="h-7 w-7" />
            <span className="text-sm">Buscando no catálogo…</span>
          </div>
        )}

        {search.status === "short" && (
          <p className="text-sm text-white/40">Continue digitando.</p>
        )}

        {search.status === "ready" && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-[var(--lt-surface)]">
              <BookOpen className="h-12 w-12 text-white/25" strokeWidth={1.25} />
            </div>
            <h2 className="text-xl font-semibold text-white">Nenhum livro</h2>
            <p className="mt-2 max-w-sm text-sm text-[var(--lt-muted)]">
              Tente outro título, autor ou ISBN.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {books.map((book) => (
            <LiquidGlass key={book.key} className="rounded-2xl">
              <div className="flex items-center gap-4 px-4 py-4">
                <Link
                  href={routes.book(bookSlug(book))}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt=""
                      className="h-16 w-11 shrink-0 rounded-md object-cover bg-white/10"
                    />
                  ) : (
                    <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-md bg-white/10">
                      <BookOpen
                        className="h-5 w-5 text-white/35"
                        strokeWidth={1.25}
                      />
                    </div>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-white">
                      {book.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-white/40">
                      {book.authors.join(", ") || "Autor desconhecido"}
                      {book.year ? ` · ${book.year}` : ""}
                    </span>
                  </span>
                </Link>
                <AddToShelfButton book={book} />
              </div>
            </LiquidGlass>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
