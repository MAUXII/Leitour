import type { Timestamp } from "firebase/firestore";
import {
  createPost,
  listFeedPosts,
  type CreatePostInput,
  type FeedPost,
} from "@/lib/firebase/posts";

export type { FeedPost, CreatePostInput };

export const FEED_CHANGED_EVENT = "leitour:feed-changed";

export function notifyFeedChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FEED_CHANGED_EVENT));
}

/** Carrega publicações do feed (adapter Firestore em posts.ts). */
export async function loadFeed(max = 30): Promise<FeedPost[]> {
  return listFeedPosts(max);
}

/** Publica uma review e sinaliza o feed para recarregar. */
export async function publishToFeed(input: CreatePostInput): Promise<string> {
  const id = await createPost(input);
  notifyFeedChanged();
  return id;
}

/** Tempo relativo para cards do feed. */
export function formatFeedTime(createdAt?: Timestamp): string {
  if (!createdAt?.toDate) return "";
  const date = createdAt.toDate();
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
