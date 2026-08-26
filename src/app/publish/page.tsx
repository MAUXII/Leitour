"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";

function PublishForm() {
  const params = useSearchParams();
  const [title, setTitle] = useState(params.get("title") ?? "");

  return (
    <LiquidGlass className="w-full rounded-2xl">
      <div className="flex flex-col gap-4 px-5 py-5">
        <label className="flex flex-col gap-2">
          <span className="text-xs text-white/40">Livro</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título ou ISBN"
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs text-white/40">Texto</span>
          <textarea
            rows={6}
            placeholder="O que você achou?"
            className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            data-snd="button"
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Publicar
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
        <h1 className="text-[28px] font-semibold tracking-tight text-white">
          Publicar
        </h1>
        <Suspense>
          <PublishForm />
        </Suspense>
      </div>
    </AppShell>
  );
}
