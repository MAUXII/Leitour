"use client";

import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";

export default function SavedPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">
          Itens salvos
        </h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-[var(--lt-surface)]">
            <Bookmark className="h-12 w-12 text-white/25" strokeWidth={1.25} />
          </div>
          <h2 className="text-xl font-semibold text-white">Nada salvo ainda</h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--lt-muted)]">
            Salve publicações e livros para achar depois.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
