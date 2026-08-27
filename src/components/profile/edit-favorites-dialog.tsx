"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { MorphingInfinity } from "@/components/ui/morphing-infinity";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import type { CatalogBook } from "@/lib/catalog";
import type { FavoriteBook } from "@/lib/firebase/users";
import { updateUserFavorites } from "@/lib/firebase/users";
import type { ShelfItem } from "@/lib/firebase/shelf";
import { coverIndex } from "@/lib/cover-tint";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";

const SLOTS = 4;

function toFavorite(book: {
  bookKey?: string;
  key?: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  year?: number;
}): FavoriteBook {
  return {
    bookKey: book.bookKey || book.key || "",
    title: book.title,
    authors: book.authors,
    coverUrl: book.coverUrl,
    year: book.year,
  };
}

function CoverThumb({
  book,
  empty,
  onClick,
  onClear,
}: {
  book?: FavoriteBook | null;
  empty?: boolean;
  onClick?: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        data-snd="select"
        onClick={onClick}
        className={cn(
          "aspect-[2/3] w-full overflow-hidden rounded-[12px] transition",
          book
            ? "bg-white/10 shadow-[0_14px_32px_-14px_rgba(0,0,0,0.9)] hover:brightness-110"
            : "border border-dashed border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]",
        )}
      >
        {book?.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : book ? (
          <div
            className={cn(
              `ff-cover-${coverIndex(book.bookKey)}`,
              "flex h-full w-full items-center justify-center",
            )}
          >
            <BookOpen className="h-6 w-6 text-white/25" strokeWidth={1.25} />
          </div>
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/30">
            <Plus className="h-5 w-5" strokeWidth={1.5} />
            {empty ? (
              <span className="text-[10px] uppercase tracking-wide">
                Favorito
              </span>
            ) : null}
          </span>
        )}
      </button>
      {book && onClear ? (
        <button
          type="button"
          data-snd="select"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white/70 ring-1 ring-white/15 transition hover:text-white"
          aria-label="Remover"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

type EditFavoritesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uid: string;
  initial: FavoriteBook[];
  shelf: ShelfItem[];
  onSaved: (favorites: FavoriteBook[]) => void;
};

export function EditFavoritesDialog({
  open,
  onOpenChange,
  uid,
  initial,
  shelf,
  onSaved,
}: EditFavoritesDialogProps) {
  const [slots, setSlots] = useState<(FavoriteBook | null)[]>(() => {
    const base: (FavoriteBook | null)[] = [...initial];
    while (base.length < SLOTS) base.push(null);
    return base.slice(0, SLOTS);
  });
  const [activeSlot, setActiveSlot] = useState(0);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCatalogSearch(open ? query : "", {
    limit: 12,
    debounceMs: 400,
  });

  const shelfSuggestions = useMemo(() => {
    const taken = new Set(
      slots.filter(Boolean).map((s) => s!.bookKey),
    );
    return shelf
      .filter((i) => !taken.has(i.bookKey))
      .slice(0, 12);
  }, [shelf, slots]);

  function resetFromInitial() {
    const base: (FavoriteBook | null)[] = [...initial];
    while (base.length < SLOTS) base.push(null);
    setSlots(base.slice(0, SLOTS));
    setQuery("");
    setError(null);
    setActiveSlot(0);
  }

  function handleOpenChange(next: boolean) {
    if (next) resetFromInitial();
    onOpenChange(next);
  }

  function place(book: FavoriteBook) {
    playSnd("select");
    setSlots((prev) => {
      const next = [...prev];
      const already = next.findIndex((s) => s?.bookKey === book.bookKey);
      if (already >= 0) {
        next[already] = null;
      }
      next[activeSlot] = book;
      const empty = next.findIndex((s, i) => i > activeSlot && !s);
      if (empty >= 0) setActiveSlot(empty);
      return next;
    });
  }

  function placeFromCatalog(book: CatalogBook) {
    place(toFavorite({ ...book, key: book.key }));
  }

  function placeFromShelf(item: ShelfItem) {
    place(
      toFavorite({
        bookKey: item.bookKey,
        title: item.title,
        authors: item.authors,
        coverUrl: item.coverUrl,
        year: item.year,
      }),
    );
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      const list = slots.filter((s): s is FavoriteBook => s !== null);
      const profile = await updateUserFavorites(uid, list);
      playSnd("celebration");
      onSaved(profile.favorites ?? list);
      onOpenChange(false);
    } catch (err) {
      playSnd("caution");
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-lt-surface="dark"
          className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) handleOpenChange(false);
          }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[var(--lt-max-width-wide)] flex-col px-5 pb-20 pt-6 sm:px-8">
            <div className="mb-8 flex items-center justify-between gap-3">
              <button
                type="button"
                data-snd="select"
                onClick={() => handleOpenChange(false)}
                className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
              >
                Fechar
              </button>
              <button
                type="button"
                data-snd-ignore
                disabled={busy}
                onClick={() => void onSave()}
                className="rounded-[12px] bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
              >
                {busy ? "Salvando…" : "Salvar"}
              </button>
            </div>

            <DialogTitle className="sr-only">Editar favoritos</DialogTitle>

            <div className="flex flex-col gap-8">
              <div>
                <p className="lt-display text-3xl font-medium tracking-tight text-white md:text-4xl">
                  Favoritos
                </p>
                <p className="mt-2 text-sm text-white/40">
                  Escolha até quatro livros — como no Letterboxd. Toque um slot
                  e depois um livro.
                </p>
              </div>

              <ul className="mx-auto grid w-full max-w-lg grid-cols-4 gap-3">
                {slots.map((book, i) => (
                  <li key={i}>
                    <div
                      className={cn(
                        "rounded-[14px] p-0.5 transition",
                        activeSlot === i && "ring-2 ring-white/50",
                      )}
                    >
                      <CoverThumb
                        book={book}
                        empty
                        onClick={() => setActiveSlot(i)}
                        onClear={
                          book
                            ? () =>
                                setSlots((prev) => {
                                  const next = [...prev];
                                  next[i] = null;
                                  return next;
                                })
                            : undefined
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <label className="flex h-12 w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5">
                <Search
                  className="h-4 w-4 shrink-0 text-white/35"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar livro pra este slot…"
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>

              {error ? (
                <p className="text-sm text-red-300/80">{error}</p>
              ) : null}

              {search.status === "loading" ? (
                <div className="flex justify-center py-8">
                  <MorphingInfinity className="h-7 w-7 text-white/40" />
                </div>
              ) : null}

              {search.books.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.08em] text-white/35">
                    Resultados
                  </p>
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {search.books.map((book) => (
                      <li key={book.key}>
                        <button
                          type="button"
                          data-snd="select"
                          onClick={() => placeFromCatalog(book)}
                          className="group block w-full text-left"
                        >
                          {book.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={book.coverUrl}
                              alt=""
                              className="aspect-[2/3] w-full rounded-[10px] object-cover transition group-hover:brightness-110"
                            />
                          ) : (
                            <div
                              className={`ff-cover-${coverIndex(book.key)} flex aspect-[2/3] w-full items-center justify-center rounded-[10px]`}
                            >
                              <BookOpen
                                className="h-5 w-5 text-white/25"
                                strokeWidth={1.25}
                              />
                            </div>
                          )}
                          <p className="mt-1.5 line-clamp-2 text-[11px] text-white/60">
                            {book.title}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!query.trim() && shelfSuggestions.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.08em] text-white/35">
                    Da sua estante
                  </p>
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {shelfSuggestions.map((item) => (
                      <li key={item.bookKey}>
                        <button
                          type="button"
                          data-snd="select"
                          onClick={() => placeFromShelf(item)}
                          className="group block w-full text-left"
                        >
                          {item.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.coverUrl}
                              alt=""
                              className="aspect-[2/3] w-full rounded-[10px] object-cover transition group-hover:brightness-110"
                            />
                          ) : (
                            <div
                              className={`ff-cover-${coverIndex(item.bookKey)} flex aspect-[2/3] w-full items-center justify-center rounded-[10px]`}
                            >
                              <BookOpen
                                className="h-5 w-5 text-white/25"
                                strokeWidth={1.25}
                              />
                            </div>
                          )}
                          <p className="mt-1.5 line-clamp-2 text-[11px] text-white/60">
                            {item.title}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
