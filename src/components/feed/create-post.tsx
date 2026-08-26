"use client";

import { ImagePlus } from "lucide-react";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";

export function CreatePost() {
  return (
    <LiquidGlass className="w-full rounded-2xl">
      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="text-xs text-white/40">Poste algo</p>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 shrink-0 rounded-full bg-cover bg-center bg-white/10"
            style={{
              backgroundImage:
                "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?w=826')",
            }}
          />
          <input
            placeholder="O que vem na sua mente?"
            className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
          <button
            type="button"
            data-snd="select"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-white"
            aria-label="Anexar imagem"
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="submit"
            data-snd="button"
            className="shrink-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Postar
          </button>
        </div>
      </div>
    </LiquidGlass>
  );
}
