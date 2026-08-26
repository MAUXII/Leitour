"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FEED_CHANGED_EVENT,
  loadFeed,
  publishToFeed,
  type CreatePostInput,
  type FeedPost,
} from "@/lib/feed";

export type FeedState = {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  publish: (input: CreatePostInput) => Promise<string>;
};

/**
 * Lifecycle do feed: load + publish (prepend otimista após sucesso).
 */
export function useFeed(enabled: boolean): FeedState {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(async () => {
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    const onChanged = () => setTick((n) => n + 1);
    window.addEventListener(FEED_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(FEED_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPosts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void loadFeed()
      .then((list) => {
        if (!cancelled) {
          setPosts(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPosts([]);
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o feed.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  const publish = useCallback(async (input: CreatePostInput) => {
    const id = await publishToFeed(input);
    const optimistic: FeedPost = {
      id,
      authorUid: input.authorUid,
      authorName: input.authorName,
      authorHandle: input.authorHandle,
      authorPhotoURL: input.authorPhotoURL,
      bookKey: input.bookKey,
      bookTitle: input.bookTitle.trim(),
      bookCoverUrl: input.bookCoverUrl,
      bookAuthors: input.bookAuthors,
      body: input.body.trim(),
      rating: input.rating,
    };
    setPosts((prev) => [optimistic, ...prev.filter((p) => p.id !== id)]);
    return id;
  }, []);

  return { posts, loading, error, reload, publish };
}
