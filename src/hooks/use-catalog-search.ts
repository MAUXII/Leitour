"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  prepareCatalogQuery,
  type CatalogBook,
} from "@/lib/catalog";

export type CatalogSearchStatus =
  | "idle"
  | "short"
  | "loading"
  | "ready"
  | "error";

export type CatalogSearchState = {
  status: CatalogSearchStatus;
  books: CatalogBook[];
  error: string | null;
  reason: "empty" | "short" | null;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
};

type CatalogSearchOptions = {
  debounceMs?: number;
  limit?: number;
  /** Immediate fetch when query matches this (e.g. URL initial). */
  immediateQuery?: string;
  fetcher?: (
    query: string,
    signal: AbortSignal,
    page: number,
    limit: number,
  ) => Promise<{ books: CatalogBook[]; hasMore?: boolean; error?: string }>;
};

async function defaultFetcher(
  query: string,
  signal: AbortSignal,
  page: number,
  limit: number,
): Promise<{ books: CatalogBook[]; hasMore?: boolean; error?: string }> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`/api/books/search?${params}`, { signal });
  const data = (await res.json()) as {
    books?: CatalogBook[];
    hasMore?: boolean;
    error?: string;
  };
  if (!res.ok) {
    return {
      books: [],
      hasMore: false,
      error: data.error ?? "Não foi possível buscar livros.",
    };
  }
  return {
    books: data.books ?? [],
    hasMore: Boolean(data.hasMore),
  };
}

/**
 * Client catalog search: prepareCatalogQuery → debounce → fetch → abort.
 * `loadMore` pede a próxima página e faz append.
 */
export function useCatalogSearch(
  query: string,
  options: CatalogSearchOptions = {},
): CatalogSearchState {
  const {
    debounceMs = 400,
    limit = 16,
    immediateQuery,
    fetcher = defaultFetcher,
  } = options;

  const [status, setStatus] = useState<CatalogSearchStatus>("idle");
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<"empty" | "short" | null>("empty");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const queryRef = useRef(query);
  queryRef.current = query;

  const prep = prepareCatalogQuery(query);
  const prepKey = prep.ok ? `ok:${prep.q}` : `no:${prep.reason}`;

  useEffect(() => {
    if (!prep.ok) {
      setStatus(prep.reason === "short" ? "short" : "idle");
      setBooks([]);
      setError(null);
      setReason(prep.reason === "blocked" ? "empty" : prep.reason);
      setHasMore(false);
      hasMoreRef.current = false;
      setLoadingMore(false);
      loadingMoreRef.current = false;
      pageRef.current = 1;
      return;
    }

    const controller = new AbortController();
    const delay =
      immediateQuery != null && query === immediateQuery ? 0 : debounceMs;
    const q = query;

    pageRef.current = 1;

    const timer = window.setTimeout(() => {
      setStatus("loading");
      setError(null);
      setReason(null);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      void fetcher(q, controller.signal, 1, limit)
        .then((data) => {
          setBooks(data.books);
          const more = Boolean(data.hasMore);
          setHasMore(more);
          hasMoreRef.current = more;
          setStatus(data.error ? "error" : "ready");
          setError(data.error ?? null);
        })
        .catch((err) => {
          if ((err as Error).name === "AbortError") return;
          setStatus("error");
          setBooks([]);
          setHasMore(false);
          hasMoreRef.current = false;
          setError("Falha de rede ao buscar no catálogo.");
        });
    }, delay);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prepKey encodes prep
  }, [prepKey, debounceMs, limit, immediateQuery, fetcher, query]);

  const loadMore = useCallback(() => {
    if (!prep.ok) return;
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    if (status !== "ready") return;

    const nextPage = pageRef.current + 1;
    const q = queryRef.current;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    void fetcher(q, new AbortController().signal, nextPage, limit)
      .then((data) => {
        if (queryRef.current !== q) return;
        setBooks((prev) => {
          const seen = new Set(prev.map((b) => b.key));
          const appended = data.books.filter((b) => !seen.has(b.key));
          return [...prev, ...appended];
        });
        const more = Boolean(data.hasMore) && data.books.length > 0;
        setHasMore(more);
        hasMoreRef.current = more;
        pageRef.current = nextPage;
        if (data.error) setError(data.error);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setError("Falha ao carregar mais livros.");
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [prep.ok, status, fetcher, limit]);

  return {
    status,
    books,
    error,
    reason,
    hasMore,
    loadingMore,
    loadMore,
  };
}
