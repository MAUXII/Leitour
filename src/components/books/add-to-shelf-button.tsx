"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { CatalogBook } from "@/lib/catalog";
import { upsertShelfItem } from "@/lib/firebase/shelf";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";

export function AddToShelfButton({
  book,
  variant = "icon",
  className,
}: {
  book: CatalogBook;
  variant?: "icon" | "label" | "solid";
  className?: string;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onAdd() {
    if (!user) {
      playSnd("caution");
      setToast("Entre para salvar na estante.");
      return;
    }
    if (busy || done) return;
    setBusy(true);
    setToast(null);
    playSnd("select");
    try {
      await upsertShelfItem(user.uid, book, "quero_ler");
      playSnd("celebration");
      setDone(true);
      setToast("Na estante.");
    } catch (err) {
      playSnd("caution");
      setToast(
        err instanceof Error ? err.message : "Falha ao salvar na estante.",
      );
    } finally {
      setBusy(false);
    }
  }

  const label = done ? "Na estante" : busy ? "Salvando…" : null;

  if (variant === "solid") {
    return (
      <div className={cn("flex w-full flex-col gap-2", className)}>
        <button
          type="button"
          data-snd-ignore
          onClick={() => void onAdd()}
          disabled={busy || done}
          className="w-full rounded-[12px] bg-white px-5 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-black transition hover:bg-white/92 disabled:bg-white/70 disabled:text-black/50"
        >
          {label ?? "Adicionar à estante"}
        </button>
        {toast ? <p className="text-center text-xs text-white/40">{toast}</p> : null}
      </div>
    );
  }

  if (variant === "label") {
    return (
      <div className={cn("flex flex-col items-start gap-2", className)}>
        <button
          type="button"
          data-snd-ignore
          onClick={() => void onAdd()}
          disabled={busy || done}
          className="text-sm font-medium text-white/80 transition hover:text-white disabled:text-white/40"
        >
          {label ?? "Quero ler"}
        </button>
        {toast && <p className="text-xs text-white/40">{toast}</p>}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        data-snd-ignore
        onClick={() => void onAdd()}
        disabled={busy || done}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
        aria-label="Adicionar à estante"
        title={user ? "Quero ler" : "Entre para salvar"}
      >
        <BookmarkPlus className="h-4 w-4" strokeWidth={1.5} />
      </button>
      {toast && (
        <p className="absolute right-0 top-full z-10 mt-1 w-max text-xs text-white/45">
          {toast}
        </p>
      )}
    </div>
  );
}
