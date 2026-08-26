"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { playSnd } from "@/lib/snd";

type PostCardProps = {
  author?: string;
  handle?: string;
  time?: string;
  body?: string;
  avatarUrl?: string;
};

export function PostCard({
  author = "Lucas Rabaquim",
  handle = "@rabaquim",
  time = "agora",
  body = "Lorem ipsum dolor sit amet consectetur. Vestibulum nisl risus risus amet sed blandit. Enim consequat tortor mollis enim amet non elit duis.",
  avatarUrl = "https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611731.jpg?w=826",
}: PostCardProps) {
  const [liked, setLiked] = useState(false);

  return (
    <LiquidGlass className="w-full rounded-2xl">
      <article className="flex gap-3 px-4 py-5">
        <div
          className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center bg-white/10"
          style={{ backgroundImage: `url('${avatarUrl}')` }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">{author}</p>
              <p className="text-sm text-white/40">
                {handle} · {time}
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
          <p className="mt-2 text-sm leading-relaxed text-white/70">{body}</p>
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
              data-snd="swipe"
              className="transition hover:text-white"
              aria-label="Repostar"
            >
              <Repeat2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={liked ? "text-white" : "transition hover:text-white"}
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
            <button
              type="button"
              data-snd="tap4"
              className="transition hover:text-white"
              aria-label="Compartilhar"
            >
              <Share className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </article>
    </LiquidGlass>
  );
}
