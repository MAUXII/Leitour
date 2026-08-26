"use client";

import Link from "next/link";
import { BookOpen, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { bookSlug } from "@/lib/book-slug";
import { formatFeedTime, type FeedPost } from "@/lib/feed";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(false);
  const time = formatFeedTime(post.createdAt);
  const initials = post.authorName.slice(0, 2).toUpperCase() || "?";
  const slug =
    post.bookKey && post.bookTitle
      ? bookSlug({ key: post.bookKey, title: post.bookTitle })
      : null;

  return (
    <LiquidGlass className="w-full rounded-2xl">
      <article className="flex gap-3 px-4 py-5">
        {post.authorPhotoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.authorPhotoURL}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover bg-white/10"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">
                {post.authorName}
              </p>
              <p className="text-sm text-white/40">
                {post.authorHandle}
                {time ? ` · ${time}` : ""}
              </p>
            </div>
            <button
              type="button"
              data-snd="tap3"
              className="rounded-md p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
              aria-label="Mais"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          {(post.bookTitle || post.rating) && (
            <div className="mt-3 flex items-center gap-3">
              {post.bookCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.bookCoverUrl}
                  alt=""
                  className="h-14 w-9 shrink-0 rounded-md object-cover bg-white/10"
                />
              ) : (
                <div className="flex h-14 w-9 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <BookOpen
                    className="h-4 w-4 text-white/30"
                    strokeWidth={1.5}
                  />
                </div>
              )}
              <div className="min-w-0">
                {slug ? (
                  <Link
                    href={routes.book(slug)}
                    data-snd="select"
                    className="truncate text-sm font-medium text-white/85 transition hover:text-white"
                  >
                    {post.bookTitle}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-medium text-white/85">
                    {post.bookTitle}
                  </p>
                )}
                {post.bookAuthors.length > 0 ? (
                  <p className="truncate text-xs text-white/35">
                    {post.bookAuthors.join(", ")}
                  </p>
                ) : null}
                {post.rating != null ? (
                  <p className="mt-0.5 text-xs tracking-[0.12em] text-white/50">
                    {"★".repeat(post.rating)}
                    <span className="text-white/20">
                      {"★".repeat(5 - post.rating)}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <p className="mt-3 text-sm leading-relaxed text-white/70 whitespace-pre-wrap">
            {post.body}
          </p>
          <div className="mt-4 flex items-center gap-5 text-white/40">
            <button
              type="button"
              data-snd="tap1"
              className="transition hover:text-white"
              aria-label="Comentar"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={cn(
                liked ? "text-white" : "transition hover:text-white",
              )}
              aria-label="Curtir"
              aria-pressed={liked}
              onClick={() => {
                setLiked((v) => {
                  playSnd(v ? "toggleOff" : "toggleOn");
                  return !v;
                });
              }}
            >
              <Heart
                className="h-4 w-4"
                strokeWidth={1.5}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>
      </article>
    </LiquidGlass>
  );
}
