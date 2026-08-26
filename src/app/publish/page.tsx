"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { useAuth } from "@/hooks/useAuth";
import { createPost } from "@/lib/firebase/posts";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";

function PublishForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, profile, configured } = useAuth();

  const [title, setTitle] = useState(params.get("title") ?? "");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookKey = params.get("key");
  const cover = params.get("cover");
  const authors = (params.get("authors") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  async function onPublish() {
    if (!configured) {
      setError("Configure o Firebase antes de publicar.");
      return;
    }
    if (!user || !profile) {
      playSnd("caution");
      router.push(routes.login);
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    playSnd("select");
    try {
      await createPost({
        authorUid: user.uid,
        authorName: profile.displayName || "Leitor",
        authorHandle: profile.handle || "@leitor",
        authorPhotoURL: profile.photoURL || user.photoURL || null,
        bookKey,
        bookTitle: title,
        bookCoverUrl: cover,
        bookAuthors: authors,
        body,
        rating,
      });
      playSnd("celebration");
      router.push(routes.feed);
      router.refresh();
    } catch (err) {
      playSnd("caution");
      setError(
        err instanceof Error ? err.message : "Não foi possível publicar.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <LiquidGlass className="w-full rounded-2xl">
      <div className="flex flex-col gap-5 px-5 py-5">
        {cover ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              className="h-16 w-11 rounded-md object-cover bg-white/10"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {title || "Livro"}
              </p>
              {authors.length > 0 ? (
                <p className="truncate text-xs text-white/40">
                  {authors.join(", ")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <label className="flex flex-col gap-2">
          <span className="text-xs text-white/40">Livro</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-white/40">Nota (opcional)</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                data-snd-ignore
                onClick={() => {
                  playSnd("select");
                  setRating((prev) => (prev === n ? null : n));
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-lg transition",
                  rating != null && n <= rating
                    ? "bg-white/15 text-white"
                    : "text-white/25 hover:bg-white/[0.06] hover:text-white/60",
                )}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs text-white/40">Review</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={7}
            placeholder="O que você achou?"
            className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </label>

        {error ? <p className="text-sm text-red-300/90">{error}</p> : null}

        {!user ? (
          <p className="text-sm text-white/40">
            <Link href={routes.login} className="text-white/70 underline-offset-2 hover:underline">
              Entre
            </Link>{" "}
            para publicar.
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            data-snd-ignore
            disabled={busy || !title.trim() || !body.trim()}
            onClick={() => void onPublish()}
            className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/92 disabled:bg-white/40 disabled:text-black/40"
          >
            {busy ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </LiquidGlass>
  );
}

export default function PublishPage() {
  return (
    <AppShell wide>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            Publicar
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Review com nota opcional — aparece no feed.
          </p>
        </div>
        <Suspense>
          <PublishForm />
        </Suspense>
      </div>
    </AppShell>
  );
}
