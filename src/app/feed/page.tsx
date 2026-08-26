"use client";

import Link from "next/link";
import { BookOpen, PenLine } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { CreatePost } from "@/components/feed/create-post";
import { PostCard } from "@/components/feed/post-card";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { MorphingInfinity } from "@/components/ui/morphing-infinity";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/use-feed";
import { routes } from "@/lib/routes";

export default function FeedPage() {
  const { user, loading: authLoading, configured } = useAuth();
  const enabled = configured && !!user && !authLoading;
  const { posts, loading, error } = useFeed(enabled);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            Feed
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Reviews e notas dos leitores.
          </p>
        </div>

        <CreatePost />

        {error ? <p className="text-sm text-red-300/90">{error}</p> : null}

        {!configured ? (
          <p className="text-sm text-amber-200/90">
            Configure o Firebase para ver o feed.
          </p>
        ) : !user && !authLoading ? (
          <LiquidGlass className="w-full rounded-2xl">
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <h2 className="text-lg font-semibold text-white">
                Entre para ver o feed
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/40">
                As publicações ficam na conta Firebase.
              </p>
              <Link
                href={routes.login}
                data-snd="select"
                className="mt-6 inline-flex rounded-[12px] bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/92"
              >
                Entrar
              </Link>
            </div>
          </LiquidGlass>
        ) : loading || authLoading ? (
          <div className="flex items-center justify-center gap-3 py-14 text-white/40">
            <MorphingInfinity className="h-7 w-7" />
            <span className="text-sm">Carregando…</span>
          </div>
        ) : posts.length === 0 ? (
          <LiquidGlass className="w-full rounded-2xl">
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
                <PenLine className="h-6 w-6 text-white/35" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Nenhuma publicação ainda
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/40">
                Seja o primeiro a escrever uma review.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={routes.books}
                  data-snd="select"
                  className="inline-flex items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <BookOpen className="h-4 w-4" strokeWidth={1.5} />
                  Ver livros
                </Link>
                <Link
                  href={routes.publish}
                  data-snd="select"
                  className="inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/92"
                >
                  Escrever review
                </Link>
              </div>
            </div>
          </LiquidGlass>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
