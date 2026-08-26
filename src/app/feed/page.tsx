"use client";

import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { CreatePost } from "@/components/feed/create-post";
import { PostCard } from "@/components/feed/post-card";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";

const MOCK_POSTS = [
  {
    author: "Lucas Rabaquim",
    handle: "@rabaquim",
    time: "agora",
    body: "Terminei 1984 hoje. A vigilância constante ainda assusta — e parece menos ficção a cada ano.",
  },
  {
    author: "Ana Costa",
    handle: "@anac",
    time: "2h",
    body: "Estante do mês: três romances e um ensaio. Alguém tem indicação de não-ficção leve?",
  },
  {
    author: "Pedro M.",
    handle: "@pedrom",
    time: "5h",
    body: "Citação do dia: “Um leitor vive mil vidas antes de morrer.” — George R.R. Martin",
  },
  {
    author: "Marina",
    handle: "@marina.l",
    time: "ontem",
    body: "Comecei O Alienista. Machado em dose curta — perfeito pro metrô.",
  },
];

export default function FeedPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            Feed
          </h1>
        </div>

        <LiquidGlass className="w-full rounded-2xl">
          <label className="flex h-12 w-full items-center gap-3 px-4">
            <Search
              className="h-4 w-4 shrink-0 text-white/35"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder="Buscar no feed"
              className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
        </LiquidGlass>

        <MagneticTabs
          defaultValue="all"
          items={[
            { value: "all", label: "Tudo" },
            { value: "reviews", label: "Reviews" },
            { value: "quotes", label: "Citações" },
            { value: "following", label: "Seguindo" },
          ]}
        />

        <CreatePost />

        <div className="flex flex-col gap-3">
          {MOCK_POSTS.map((post) => (
            <PostCard key={post.handle + post.time} {...post} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
