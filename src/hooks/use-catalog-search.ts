"use client";

import { useEffect, useState } from "react";
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
};

type CatalogSearchOptions = {
  debounceMs?: number;
  limit?: number;
  /** Immediate fetch when query matches this (e.g. URL initial). */
  immediateQuery?: string;
  fetcher?: (
    query: string,
    signal: AbortSignal,
  ) => Promise<{ books: CatalogBook[]; error?: string }>;
};

async function defaultFetcher(
  query: string,
  signal: AbortSignal,
): Promise<{ books: CatalogBook[]; error?: string }> {
  const res = await fetch(
    `/api/books/search?q=${encodeURIComponent(query)}`,
    { signal },
  );
  const data = (await res.json()) as {
    books?: CatalogBook[];
    error?: string;
  };
  if (!res.ok) {
    return { books: [], error: data.error ?? "Não foi possível buscar livros." };
  }
  return { books: data.books ?? [] };
}

const idle: CatalogSearchState = {
  status: "idle",
  books: [],
  error: null,
  reason: "empty",
};

/**
 * Client catalog search: prepareCatalogQuery → debounce → fetch → abort.
 * Inject `fetcher` for tests (second adapter).
 */
export function useCatalogSearch(
  query: string,
  options: CatalogSearchOptions = {},
): CatalogSearchState {
  const {
    debounceMs = 400,
    limit,
    immediateQuery,
    fetcher = defaultFetcher,
  } = options;

  const [state, setState] = useState<CatalogSearchState>(idle);
  const prep = prepareCatalogQuery(query);
  const prepKey = prep.ok ? `ok:${prep.q}` : `no:${prep.reason}`;

  useEffect(() => {
    if (!prep.ok) {
      setState({
        status: prep.reason === "short" ? "short" : "idle",
        books: [],
        error: null,
        reason: prep.reason === "blocked" ? "empty" : prep.reason,
      });
      return;
    }

    const controller = new AbortController();
    const delay =
      immediateQuery != null && query === immediateQuery ? 0 : debounceMs;
    const q = query;

    const timer = window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: "loading",
        error: null,
        reason: null,
      }));
      void fetcher(q, controller.signal)
        .then((data) => {
          const books =
            limit != null ? data.books.slice(0, limit) : data.books;
          setState({
            status: data.error ? "error" : "ready",
            books,
            error: data.error ?? null,
            reason: null,
          });
        })
        .catch((err) => {
          if ((err as Error).name === "AbortError") return;
          setState({
            status: "error",
            books: [],
            error: "Falha de rede ao buscar no catálogo.",
            reason: null,
          });
        });
    }, delay);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prepKey encodes prep
  }, [prepKey, debounceMs, limit, immediateQuery, fetcher, query]);

  return state;
}
