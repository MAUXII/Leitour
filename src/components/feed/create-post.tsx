"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";

/** CTA do feed — ainda não posta no banco (Sprint 2). */
export function CreatePost() {
  const { user, profile } = useAuth();
  const photo = profile?.photoURL || user?.photoURL || null;
  const initials = (profile?.displayName || "?").slice(0, 2).toUpperCase();

  return (
    <LiquidGlass className="w-full rounded-2xl">
      <Link
        href={routes.publish}
        data-snd="select"
        className="flex items-center gap-3 px-4 py-4 transition hover:bg-white/[0.03]"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover bg-white/10"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white/70">
            {user ? initials : <BookOpen className="h-4 w-4 text-white/35" strokeWidth={1.5} />}
          </div>
        )}
        <span className="flex-1 text-sm text-white/35">
          {user ? "Escrever uma publicação…" : "Entre para publicar…"}
        </span>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white">
          Publicar
        </span>
      </Link>
    </LiquidGlass>
  );
}
