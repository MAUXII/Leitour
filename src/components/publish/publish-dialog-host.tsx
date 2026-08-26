"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PublishDialog,
  type PublishDraft,
} from "@/components/publish/publish-dialog";
import { isPublishOpen, PUBLISH_QUERY_KEYS } from "@/lib/routes";
import { playSnd } from "@/lib/snd";

function PublishDialogHostInner() {
  const router = useRouter();
  const pathname = usePathname() || "/feed";
  const searchParams = useSearchParams();
  const open = isPublishOpen(searchParams);

  const draft: PublishDraft = useMemo(
    () => ({
      title: searchParams.get("title") ?? "",
      key: searchParams.get("key"),
      cover: searchParams.get("cover"),
      authors: (searchParams.get("authors") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }),
    [searchParams],
  );

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onOpenChange = useCallback(
    (next: boolean) => {
      replaceParams((params) => {
        if (next) {
          params.set("publish", "1");
          playSnd("transitionUp");
        } else {
          for (const key of PUBLISH_QUERY_KEYS) params.delete(key);
          playSnd("transitionDown");
        }
      });
    },
    [replaceParams],
  );

  const onSelectBook = useCallback(
    (book: PublishDraft) => {
      replaceParams((params) => {
        params.set("publish", "1");
        if (book.title) params.set("title", book.title);
        else params.delete("title");
        if (book.key) params.set("key", book.key);
        else params.delete("key");
        if (book.cover) params.set("cover", book.cover);
        else params.delete("cover");
        if (book.authors.length) params.set("authors", book.authors.join(", "));
        else params.delete("authors");
      });
    },
    [replaceParams],
  );

  return (
    <PublishDialog
      open={open}
      onOpenChange={onOpenChange}
      draft={draft}
      onSelectBook={onSelectBook}
    />
  );
}

export function PublishDialogHost() {
  return (
    <Suspense fallback={null}>
      <PublishDialogHostInner />
    </Suspense>
  );
}
