"use client";

import { BookOpen, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AddToShelfButton } from "@/components/books/add-to-shelf-button";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { MorphingInfinity } from "@/components/ui/morphing-infinity";
import { Tooltip } from "@/components/ui/tooltip";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { bookSlug } from "@/lib/book-slug";
import {
  CATALOG_GENRES,
  genreFromSubjectQuery,
} from "@/lib/catalog-genres";
import { coverIndex } from "@/lib/cover-tint";
import { subjectSearchQuery } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 16;

export function BooksCatalog({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const search = useCatalogSearch(query, {
    immediateQuery: initialQuery,
    limit: PAGE_SIZE,
    debounceMs: 550,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) search.loadMore();
      },
      { rootMargin: "280px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [search.loadMore, search.hasMore, search.books.length]);

  const books = search.books;
  const error = search.error;
  const pending = search.status === "loading";
  const queryOk = search.status !== "idle" && search.status !== "short";
  const activeGenre = genreFromSubjectQuery(query);
  const idle = search.status === "idle" || (!query.trim() && !pending);

  function commitQuery(next: string, { replaceUrl = true } = {}) {
    setQuery(next);
    if (!replaceUrl) return;
    const path = next.trim()
      ? routes.booksSearch(next.trim())
      : routes.books;
    router.replace(path, { scroll: false });
  }

  function pickGenre(subject: string) {
    playSnd("select");
    commitQuery(subjectSearchQuery(subject));
  }

  function clearQuery() {
    playSnd("select");
    commitQuery("");
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-white">
              Livros
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Busque por título, autor ou explore um gênero
            </p>
          </div>
          <LiquidGlass className="!rounded-full">
            <Link
              href={routes.publish}
              data-snd="select"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/85 transition hover:text-white"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Adicionar
            </Link>
          </LiquidGlass>
        </div>

        <LiquidGlass className="w-full !rounded-full">
          <label className="flex h-12 w-full items-center gap-3 px-5">
            <Search
              className="h-4 w-4 shrink-0 text-white/35"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query.startsWith("subject:") ? "" : query}
              onChange={(e) => commitQuery(e.target.value)}
              placeholder={
                activeGenre
                  ? `Gênero: ${activeGenre.label}`
                  : "Título, autor ou ISBN…"
              }
              className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
            {query.trim() ? (
              <button
                type="button"
                data-snd="select"
                onClick={clearQuery}
                className="rounded-full p-1 text-white/35 transition hover:text-white/70"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            ) : null}
          </label>
        </LiquidGlass>

        <div className="flex flex-wrap gap-2">
          {CATALOG_GENRES.map((genre) => {
            const active = activeGenre?.id === genre.id;
            return (
              <LiquidGlass
                key={genre.id}
                className={cn(
                  "!rounded-full transition",
                  active && "ring-1 ring-white/35",
                )}
              >
                <button
                  type="button"
                  data-snd-ignore
                  onClick={() =>
                    active ? clearQuery() : pickGenre(genre.subject)
                  }
                  className={cn(
                    "px-3.5 py-1.5 text-[12px] font-medium tracking-[-0.01em] transition",
                    active
                      ? "text-white"
                      : "text-white/55 hover:text-white/90",
                  )}
                >
                  {genre.label}
                </button>
              </LiquidGlass>
            );
          })}
        </div>

        {activeGenre ? (
          <p className="text-sm text-white/40">
            Explorando{" "}
            <span className="text-white/70">{activeGenre.label}</span>
          </p>
        ) : null}

        {error && <p className="text-sm text-red-300/90">{error}</p>}

        {queryOk && pending && books.length === 0 && !error && (
          <div className="flex items-center justify-center gap-3 py-14 text-white/40">
            <MorphingInfinity className="h-7 w-7" />
            <span className="text-sm">Buscando no catálogo…</span>
          </div>
        )}

        {search.status === "short" && (
          <p className="text-sm text-white/40">Continue digitando.</p>
        )}

        {idle && !pending ? (
          <p className="py-6 text-sm text-white/35">
            Escolha um gênero ou digite um título para começar.
          </p>
        ) : null}

        {search.status === "ready" && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen
              className="mb-4 h-10 w-10 text-white/25"
              strokeWidth={1.25}
            />
            <h2 className="text-lg font-semibold text-white">Nenhum livro</h2>
            <p className="mt-2 max-w-sm text-sm text-white/40">
              Tente outro título, autor ou troque o gênero.
            </p>
          </div>
        )}

        {books.length > 0 ? (
          <>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
              {books.map((book) => (
                <li key={book.key} className="group relative">
                  <Tooltip label={book.title}>
                    <Link
                      href={routes.book(bookSlug(book))}
                      data-snd="select"
                      className="block overflow-hidden rounded-[12px]"
                    >
                      {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="aspect-[2/3] w-full rounded-[12px] object-cover bg-white/10 shadow-[0_14px_32px_-14px_rgba(0,0,0,0.9)] transition-[transform,filter] duration-500 ease-out will-change-transform group-hover:scale-[1.03] group-hover:brightness-[1.04]"
                        />
                      ) : (
                        <div
                          className={cn(
                            `ff-cover-${coverIndex(book.key)}`,
                            "flex aspect-[2/3] w-full items-center justify-center rounded-[12px] transition-[filter] duration-500 ease-out group-hover:brightness-[1.04]",
                          )}
                        >
                          <BookOpen
                            className="h-7 w-7 text-white/25"
                            strokeWidth={1.25}
                          />
                        </div>
                      )}
                    </Link>
                  </Tooltip>
                  <div className="pointer-events-none absolute right-1.5 top-1.5 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                    <LiquidGlass className="!rounded-full !bg-black/45 !shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/20">
                      <AddToShelfButton
                        book={book}
                        variant="icon"
                        tooltipSide="left"
                        className="[&_button]:text-white"
                      />
                    </LiquidGlass>
                  </div>
                  <div className="mt-2.5 min-w-0">
                    <Link
                      href={routes.book(bookSlug(book))}
                      className="block truncate text-[13px] font-medium text-white/85 transition hover:text-white"
                    >
                      {book.title}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-white/35">
                      {book.authors[0] ? (
                        <Link
                          href={routes.author(book.authors[0])}
                          data-snd="select"
                          className="hover:text-white/60"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {book.authors[0]}
                        </Link>
                      ) : (
                        "Autor desconhecido"
                      )}
                      {book.year ? ` · ${book.year}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
            {search.loadingMore ? (
              <div className="flex items-center justify-center gap-3 py-6 text-white/40">
                <MorphingInfinity className="h-6 w-6" />
                <span className="text-sm">Carregando mais…</span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
