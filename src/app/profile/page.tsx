"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { Tooltip } from "@/components/ui/tooltip";
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

function ShelfGrid({ items }: { items: ShelfItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-white/45">Nada por aqui ainda.</p>
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
    <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {items.map((item) => {
        const slug = bookSlug({ key: item.bookKey, title: item.title });
        return (
          <li key={item.bookKey}>
            <Tooltip label={item.title}>
              <Link
                href={routes.book(slug)}
                data-snd="select"
                className="group block"
              >
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="aspect-[2/3] w-full rounded-[10px] object-cover shadow-[0_14px_32px_-14px_rgba(0,0,0,0.9)] transition duration-300 group-hover:brightness-110 group-hover:scale-[1.02]"
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
              </Link>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}

function filterShelf(items: ShelfItem[], status?: ShelfStatus) {
  if (!status) return items;
  return items.filter((i) => i.status === status);
}

export default function ProfilePage() {
  const { user, profile, loading, configured, refreshProfile } = useAuth();
  const [shelf, setShelf] = useState<ShelfItem[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setShelf([]);
      return;
    }
    void listShelf(user.uid)
      .then(setShelf)
      .catch(() => setShelf([]));
  }, [user]);

  const counts = useMemo(() => {
    const want = shelf.filter((i) => i.status === "quero_ler").length;
    const reading = shelf.filter((i) => i.status === "lendo").length;
    const read = shelf.filter((i) => i.status === "lido").length;
    return {
      all: shelf.length,
      want,
      reading,
      read,
    };
  }, [shelf]);

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
  const bio = profile.bio?.trim();

  return (
    <>
      <HubAtmosphere coverUrl={photo} seed={user.uid} />
      <AppShell className="relative z-[1] bg-transparent">
        <div className="flex flex-col gap-10">
          {/* Header clean: foto quadrada grande + identidade */}
          <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="h-36 w-36 shrink-0 rounded-[18px] object-cover bg-white/10 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.85)] sm:h-44 sm:w-44 sm:rounded-[20px]"
              />
            ) : (
              <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-[18px] bg-white/[0.07] text-3xl font-medium tracking-tight text-white/70 sm:h-44 sm:w-44 sm:rounded-[20px] sm:text-4xl">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="lt-display text-[2rem] font-medium leading-none tracking-tight text-white sm:text-[2.5rem]">
                    {profile.displayName || "Leitor"}
                  </h1>
                  <p className="mt-2 text-[15px] text-white/40">
                    {profile.handle}
                  </p>
                </div>
                <LiquidGlass className="shrink-0 !rounded-full">
                  <button
                    type="button"
                    data-snd="select"
                    onClick={() => setEditOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white/85 transition hover:text-white"
                  >
                    Editar perfil
                  </button>
                </LiquidGlass>
              </div>
              {bio ? (
                <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-white/60">
                  {bio}
                </p>
              ) : (
                <p className="mt-4 text-[15px] text-white/30">Sem bio ainda.</p>
              )}
            </div>
          </header>

          <MagneticTabs
            defaultValue="shelf"
            size="lg"
            glass
            contentBoxed={false}
            items={[
              {
                value: "shelf",
                label: "Estante",
                badge: counts.all,
                content: <ShelfGrid items={shelf} />,
              },
              {
                value: "want",
                label: "Quero ler",
                badge: counts.want,
                content: (
                  <ShelfGrid items={filterShelf(shelf, "quero_ler")} />
                ),
              },
              {
                value: "reading",
                label: "Lendo",
                badge: counts.reading,
                content: <ShelfGrid items={filterShelf(shelf, "lendo")} />,
              },
              {
                value: "read",
                label: "Lidos",
                badge: counts.read,
                content: <ShelfGrid items={filterShelf(shelf, "lido")} />,
              },
              {
                value: "posts",
                label: "Publicações",
                content: (
                  <p className="py-8 text-sm text-white/40">
                    Publicações no perfil — em breve.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </AppShell>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        profile={profile}
        onSaved={refreshProfile}
      />
    </>
  );
}
