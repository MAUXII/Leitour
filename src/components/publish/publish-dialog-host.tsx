"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PublishDialog } from "@/components/publish/publish-dialog";
import {
  applyPublishDraft,
  isPublishOpen,
  parsePublishDraft,
  type PublishDraft,
} from "@/lib/publish-session";
import { playSnd } from "@/lib/snd";

function PublishDialogHostInner() {
  const router = useRouter();
  const pathname = usePathname() || "/feed";
  const searchParams = useSearchParams();
  const open = isPublishOpen(searchParams);

  const draft = useMemo(
    () => parsePublishDraft(searchParams),
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
          applyPublishDraft(params, null);
          playSnd("transitionDown");
        }
      });
    },
    [replaceParams],
  );

  const onSelectBook = useCallback(
    (book: PublishDraft) => {
      replaceParams((params) => applyPublishDraft(params, book));
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
