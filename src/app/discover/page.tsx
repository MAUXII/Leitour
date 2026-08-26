"use client";

import { Compass, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import GlassAICard from "@/components/ruixen/glass-ai-card";

const HIGHLIGHTS = [
  {
    title: "Clássicos brasileiros",
    hint: "12 livros em alta esta semana",
  },
  {
    title: "Não-ficção curta",
    hint: "Ensaios para ler em uma sentada",
  },
  {
    title: "Leitores perto de você",
    hint: "Perfis com estantes parecidas",
  },
];

export default function DiscoverPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            Descobrir
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
              placeholder="Buscar livros e leitores"
              className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
        </LiquidGlass>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex flex-col gap-3">
            {HIGHLIGHTS.map((item) => (
              <LiquidGlass key={item.title} className="rounded-2xl">
                <div className="flex items-center gap-4 px-4 py-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Compass
                      className="h-5 w-5 text-white/40"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-white/45">{item.hint}</p>
                  </div>
                </div>
              </LiquidGlass>
            ))}
          </div>
          <GlassAICard
            actionLabel="Sugerir leitura"
            onAction={() => undefined}
          />
        </div>
      </div>
    </AppShell>
  );
}
