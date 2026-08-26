"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookOpen, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { PageLoader } from "@/components/ui/morphing-infinity";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";
import { useAuth } from "@/hooks/useAuth";
import { listShelf, type ShelfItem } from "@/lib/firebase/shelf";
import { routes } from "@/lib/routes";

export default function ProfilePage() {
  const { user, profile, loading, configured } = useAuth();
  const [shelf, setShelf] = useState<ShelfItem[]>([]);

  useEffect(() => {
    if (!user) {
      setShelf([]);
      return;
    }
    void listShelf(user.uid)
      .then(setShelf)
      .catch(() => setShelf([]));
  }, [user]);

  if (loading) {
    return <PageLoader />;
  }

  if (!configured) {
    return (
      <AppShell>
        <p className="text-sm text-amber-200/90">
          Configure o Firebase com{" "}
          <code className="text-white/80">bash scripts/setup-firebase.sh</code>.
        </p>
      </AppShell>
    );
  }

  if (!user || !profile) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-white">Entre para ver o perfil</h1>
          <Link
            href={routes.login}
            className="mx-auto rounded-full border border-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/5"
          >
            Entrar
          </Link>
        </div>
      </AppShell>
    );
  }

  const initials = profile.displayName.slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <LiquidGlass className="rounded-2xl">
          <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-medium text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-semibold tracking-tight text-white">
                {profile.displayName}
              </h1>
              <p className="text-sm text-white/45">{profile.handle}</p>
              <p className="mt-2 max-w-md text-sm text-white/55">
                {profile.bio || "Sem bio ainda."}
              </p>
            </div>
          </div>
        </LiquidGlass>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Publicações", value: "0", icon: LayoutGrid },
            { label: "Livros", value: String(shelf.length), icon: BookOpen },
            {
              label: "Salvos",
              value: String(shelf.filter((i) => i.status === "salvo").length),
              icon: Bookmark,
            },
          ].map(({ label, value, icon: Icon }) => (
            <LiquidGlass key={label} className="rounded-2xl">
              <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                <Icon className="h-4 w-4 text-white/35" strokeWidth={1.5} />
                <p className="text-lg font-semibold text-white">{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            </LiquidGlass>
          ))}
        </div>

        <MagneticTabs
          defaultValue="shelf"
          items={[
            {
              value: "shelf",
              label: "Estante",
              content:
                shelf.length === 0
                  ? "Sua estante está vazia. Em Livros, adicione uma obra."
                  : shelf
                      .map((i) => `${i.title} (${i.status})`)
                      .join(" · "),
            },
            { value: "posts", label: "Publicações", content: "Em breve." },
            { value: "lists", label: "Listas", content: "Em breve." },
          ]}
        />
      </div>
    </AppShell>
  );
}
