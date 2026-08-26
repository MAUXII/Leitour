import type { CreatePostInput } from "@/lib/firebase/posts";

/** Draft de review na query string (`?publish=1&title=…`). */
export type PublishDraft = {
  title: string;
  key: string | null;
  cover: string | null;
  authors: string[];
};

export const PUBLISH_QUERY_KEYS = [
  "publish",
  "title",
  "key",
  "cover",
  "authors",
] as const;

const emptyDraft = (): PublishDraft => ({
  title: "",
  key: null,
  cover: null,
  authors: [],
});

export function isPublishOpen(searchParams: URLSearchParams): boolean {
  const v = searchParams.get("publish");
  return v === "1" || v === "true" || v === "";
}

export function parsePublishDraft(
  searchParams: URLSearchParams,
): PublishDraft {
  return {
    title: searchParams.get("title") ?? "",
    key: searchParams.get("key"),
    cover: searchParams.get("cover"),
    authors: (searchParams.get("authors") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** Escreve ou limpa o draft na URL. `draft: null` fecha o diálogo. */
export function applyPublishDraft(
  params: URLSearchParams,
  draft: PublishDraft | null,
): void {
  if (draft == null) {
    for (const key of PUBLISH_QUERY_KEYS) params.delete(key);
    return;
  }
  params.set("publish", "1");
  if (draft.title) params.set("title", draft.title);
  else params.delete("title");
  if (draft.key) params.set("key", draft.key);
  else params.delete("key");
  if (draft.cover) params.set("cover", draft.cover);
  else params.delete("cover");
  if (draft.authors.length) params.set("authors", draft.authors.join(", "));
  else params.delete("authors");
}

export function openPublishHref(
  input?: {
    title: string;
    key?: string;
    coverUrl?: string;
    authors?: string[];
  },
  pathname = "/feed",
): string {
  const params = new URLSearchParams();
  if (input) {
    applyPublishDraft(params, {
      title: input.title,
      key: input.key ?? null,
      cover: input.coverUrl ?? null,
      authors: input.authors ?? [],
    });
  } else {
    params.set("publish", "1");
  }
  const base = pathname.split("?")[0] || "/feed";
  return `${base}?${params.toString()}`;
}

export function emptyPublishDraft(): PublishDraft {
  return emptyDraft();
}

export function toCreatePostInput(
  draft: PublishDraft,
  author: {
    uid: string;
    displayName: string;
    handle: string;
    photoURL: string | null;
  },
  body: string,
  rating: number | null,
): CreatePostInput {
  return {
    authorUid: author.uid,
    authorName: author.displayName,
    authorHandle: author.handle,
    authorPhotoURL: author.photoURL,
    bookKey: draft.key,
    bookTitle: draft.title,
    bookCoverUrl: draft.cover,
    bookAuthors: draft.authors,
    body,
    rating,
  };
}
