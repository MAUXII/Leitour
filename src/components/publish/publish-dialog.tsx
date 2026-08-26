"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, Search, X } from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { useAuth } from "@/hooks/useAuth";
import { type CatalogBook } from "@/lib/catalog";
import { publishToFeed } from "@/lib/feed";
import {
  emptyPublishDraft,
  toCreatePostInput,
  type PublishDraft,
} from "@/lib/publish-session";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";
import { useCatalogSearch } from "@/hooks/use-catalog-search";

export type { PublishDraft };

type PublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: PublishDraft;
  onSelectBook?: (book: PublishDraft) => void;
};

function draftFromBook(book: CatalogBook): PublishDraft {
  return {
    title: book.title,
    key: book.key,
    cover: book.coverUrl ?? null,
    authors: book.authors,
  };
}

export function PublishDialog({
  open,
  onOpenChange,
  draft,
  onSelectBook,
}: PublishDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, configured } = useAuth();
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<PublishDraft>(draft);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCatalogSearch(open ? query : "", {
    debounceMs: 280,
    limit: 8,
  });
  const results = search.books;
  const searching = search.status === "loading";

  useEffect(() => {
    if (!open) return;
    setSelected(draft);
    setQuery("");
    setMenuOpen(false);
    setBody("");
    setRating(null);
    setError(null);
  }, [open, draft.title, draft.key, draft.cover, draft.authors]);

  useEffect(() => {
    if (!open || !menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, menuOpen]);

  useEffect(() => {
    if (!open) return;
    if (search.status === "ready" && search.books.length > 0) {
      setMenuOpen(true);
    }
  }, [open, search.status, search.books.length]);

  function pickBook(book: CatalogBook) {
    const next = draftFromBook(book);
    setSelected(next);
    setQuery("");
    setMenuOpen(false);
    playSnd("select");
    onSelectBook?.(next);
  }

  function clearBook() {
    const empty = emptyPublishDraft();
    setSelected(empty);
    setQuery("");
    onSelectBook?.(empty);
    playSnd("select");
  }

  async function onPublish() {
    if (!configured) {
      setError("Configure o Firebase antes de publicar.");
      return;
    }
    if (!user || !profile) {
      playSnd("caution");
      onOpenChange(false);
      router.push(routes.login);
      return;
    }
    if (!selected.title.trim()) {
      setError("Escolha um livro na busca.");
      playSnd("caution");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    playSnd("select");
    try {
      await publishToFeed(
        toCreatePostInput(
          selected,
          {
            uid: user.uid,
            displayName: profile.displayName || "Leitor",
            handle: profile.handle || "@leitor",
            photoURL: profile.photoURL || user.photoURL || null,
          },
          body,
          rating,
        ),
      );
      playSnd("celebration");
      onOpenChange(false);
      if (pathname !== "/feed" && !pathname?.startsWith("/feed")) {
        router.push(routes.feed);
      } else {
        router.refresh();
      }
    } catch (err) {
      playSnd("caution");
      setError(
        err instanceof Error ? err.message : "Não foi possível publicar.",
      );
    } finally {
      setBusy(false);
    }
  }

  const canPublish = !!selected.title.trim() && !!body.trim() && !busy;
  const authorName = profile?.displayName || user?.displayName || "Você";
  const authorPhoto = profile?.photoURL || user?.photoURL || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[var(--lt-max-width-wide)] flex-col px-5 pb-20 pt-6 sm:px-8">
            <div className="mb-8 flex items-center justify-between gap-3">
              <button
                type="button"
                data-snd="select"
                onClick={() => onOpenChange(false)}
                className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
              >
                Fechar
              </button>
              <button
                type="button"
                data-snd-ignore
                disabled={!canPublish}
                onClick={() => void onPublish()}
                className="rounded-[12px] bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
              >
                {busy ? "Publicando…" : "Publicar"}
              </button>
            </div>

            <DialogTitle className="sr-only">Publicar review</DialogTitle>

            <div className="grid w-full gap-10 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
              {/* Capa — coluna esquerda (Presence Track create) */}
              <aside className="mx-auto w-[min(100%,240px)] md:mx-0 md:w-full">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[12px] bg-white/[0.06] shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)]">
                  {selected.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/35">
                      <BookOpen className="h-8 w-8" strokeWidth={1.25} />
                      <span className="px-4 text-center text-xs">
                        Escolha um livro
                      </span>
                    </div>
                  )}
                </div>
                {selected.title ? (
                  <button
                    type="button"
                    data-snd-ignore
                    onClick={clearBook}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-white/10 py-2.5 text-sm text-white/45 transition hover:bg-white/[0.04] hover:text-white/70"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Trocar livro
                  </button>
                ) : null}
              </aside>

              {/* Formulário — coluna direita */}
              <div className="flex min-w-0 flex-col gap-6">
                <LiquidGlass className="rounded-full self-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-white/70">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[10px] font-semibold text-white/80">
                      {authorPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={authorPhoto}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (authorName || "U").charAt(0).toUpperCase()
                      )}
                    </span>
                    {authorName}
                  </div>
                </LiquidGlass>

                <div ref={searchWrapRef} className="relative">
                  {selected.title ? (
                    <div>
                      <p className="lt-display text-3xl font-medium tracking-tight text-white md:text-4xl">
                        {selected.title}
                      </p>
                      {selected.authors.length > 0 ? (
                        <p className="mt-2 text-sm text-white/40">
                          {selected.authors.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <label className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <Search
                          className="h-5 w-5 shrink-0 text-white/30"
                          strokeWidth={1.5}
                        />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onFocus={() => {
                            if (results.length) setMenuOpen(true);
                          }}
                          placeholder="Buscar livro…"
                          className="lt-display w-full border-0 bg-transparent text-3xl font-medium text-white outline-none placeholder:text-white/25 md:text-4xl"
                          autoComplete="off"
                        />
                      </label>

                      {menuOpen && (results.length > 0 || searching) ? (
                        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/55 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                          {searching && results.length === 0 ? (
                            <p className="animate-menu-rise px-3.5 py-3 text-sm text-white/40">
                              Buscando…
                            </p>
                          ) : (
                            results.map((book, i) => (
                              <button
                                key={book.key}
                                type="button"
                                data-snd-ignore
                                onClick={() => pickBook(book)}
                                className="animate-menu-rise flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/5 motion-reduce:animate-none"
                                style={{ animationDelay: `${40 + i * 40}ms` }}
                              >
                                {book.coverUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={book.coverUrl}
                                    alt=""
                                    className="h-12 w-8 shrink-0 rounded-md object-cover bg-white/10"
                                  />
                                ) : (
                                  <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                                    <BookOpen
                                      className="h-3.5 w-3.5 text-white/30"
                                      strokeWidth={1.5}
                                    />
                                  </div>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm text-white">
                                    {book.title}
                                  </span>
                                  <span className="mt-0.5 block truncate text-xs text-white/40">
                                    {book.authors.join(", ") ||
                                      "Autor desconhecido"}
                                    {book.year ? ` · ${book.year}` : ""}
                                  </span>
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-white/35">
                    Nota
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        data-snd-ignore
                        onClick={() => {
                          playSnd("select");
                          setRating((prev) => (prev === n ? null : n));
                        }}
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl text-xl transition",
                          rating != null && n <= rating
                            ? "text-white"
                            : "text-white/20 hover:text-white/50",
                        )}
                        aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-white/35">
                    Review
                  </span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    placeholder="O que você achou?"
                    className="w-full resize-none border-0 border-b border-white/10 bg-transparent pb-3 text-[15px] font-light leading-7 text-white/80 outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </label>

                {error ? (
                  <p className="text-sm text-red-300/90">{error}</p>
                ) : null}

                {!user ? (
                  <p className="text-sm text-white/40">
                    <Link
                      href={routes.login}
                      className="text-white/70 underline-offset-2 hover:underline"
                    >
                      Entre
                    </Link>{" "}
                    para publicar.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
