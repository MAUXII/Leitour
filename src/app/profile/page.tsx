"use client";

import { useEffect, useState } from "react";
import { BookOpen, BookmarkCheck, Library } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { PageLoader } from "@/components/ui/morphing-infinity";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";
import { useAuth } from "@/hooks/useAuth";
import { bookSlug } from "@/lib/book-slug";
import {
  listShelf,
  type ShelfItem,
  type ShelfStatus,
} from "@/lib/firebase/shelf";
import { routes } from "@/lib/routes";
import { coverIndex } from "@/lib/cover-tint";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ShelfStatus, string> = {
  quero_ler: "Quero ler",
  lendo: "Lendo",
  lido: "Lido",
  salvo: "Salvo",
};

function ShelfGrid({ items }: { items: ShelfItem[] }) {
  if (items.length === 0) {
    return (
      <div className="px-1 py-8 text-center">
        <p className="text-sm text-white/45">Sua estante está vazia.</p>
        <Link
          href={routes.books}
          data-snd="select"
          className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/92"
        >
          <BookOpen className="h-4 w-4" strokeWidth={1.5} />
          Buscar livros
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {items.map((item) => {
        const slug = bookSlug({ key: item.bookKey, title: item.title });
        return (
          <li key={item.bookKey}>
            <Link
              href={routes.book(slug)}
              data-snd="select"
              className="group flex flex-col gap-2"
            >
              {item.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverUrl}
                  alt=""
                  className="aspect-[2/3] w-full rounded-[10px] object-cover shadow-[0_12px_28px_-12px_rgba(0,0,0,0.85)] transition group-hover:brightness-110"
                />
              ) : (
                <div
                  className={cn(
                    `ff-cover-${coverIndex(item.bookKey)}`,
                    "flex aspect-[2/3] w-full items-center justify-center rounded-[10px]",
                  )}
                >
                  <BookOpen
                    className="h-6 w-6 text-white/25"
                    strokeWidth={1.25}
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white/80">
                  {item.title}
                </p>
                <p className="truncate text-[11px] text-white/35">
                  {STATUS_LABEL[item.status]}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

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
          <h1 className="text-xl font-semibold text-white">
            Entre para ver o perfil
          </h1>
          <Link
            href={routes.login}
            className="mx-auto rounded-[12px] bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/92"
          >
            Entrar
          </Link>
        </div>
      </AppShell>
    );
  }

  const photo = profile.photoURL || user.photoURL || null;
  const initials = profile.displayName.slice(0, 2).toUpperCase() || "?";
  const want = shelf.filter((i) => i.status === "quero_ler").length;
  const reading = shelf.filter((i) => i.status === "lendo").length;
  const read = shelf.filter((i) => i.status === "lido").length;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <LiquidGlass className="rounded-2xl">
          <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover bg-white/10"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-medium text-white">
                {initials}
              </div>
            )}
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
            { label: "Na estante", value: String(shelf.length), icon: Library },
            { label: "Quero ler", value: String(want + reading), icon: BookOpen },
            { label: "Lidos", value: String(read), icon: BookmarkCheck },
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
              content: <ShelfGrid items={shelf} />,
            },
            {
              value: "posts",
              label: "Publicações",
              content: (
                <p className="py-6 text-center text-sm text-white/40">
                  Publicações no perfil chegam com o feed real.
                </p>
              ),
            },
            {
              value: "lists",
              label: "Listas",
              content: (
                <p className="py-6 text-center text-sm text-white/40">
                  Listas personalizadas — em breve.
                </p>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
