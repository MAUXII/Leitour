"use client";

import Link from "next/link";
import { Bookmark, BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { routes } from "@/lib/routes";

export default function SavedPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            Itens salvos
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Publicações e trechos favoritos — em breve.
          </p>
        </div>

        <LiquidGlass className="w-full rounded-2xl">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
              <Bookmark className="h-6 w-6 text-white/35" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Nada salvo ainda
            </h2>
            <p className="mt-2 max-w-sm text-sm text-white/40">
              Sua estante de livros já funciona no perfil. Salvar posts do feed
              chega depois.
            </p>
            <Link
              href={routes.books}
              data-snd="select"
              className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/92"
            >
              <BookOpen className="h-4 w-4" strokeWidth={1.5} />
              Ver livros
            </Link>
          </div>
        </LiquidGlass>
      </div>
    </AppShell>
  );
}
