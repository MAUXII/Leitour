"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Pencil } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { EditFavoritesDialog } from "@/components/profile/edit-favorites-dialog";
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
import {
  normalizeFavorites,
  type FavoriteBook,
} from "@/lib/firebase/users";
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
                className="group block overflow-hidden rounded-[10px]"
              >
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="aspect-[2/3] w-full rounded-[10px] object-cover shadow-[0_14px_32px_-14px_rgba(0,0,0,0.9)] transition-[transform,filter] duration-500 ease-out will-change-transform group-hover:scale-[1.03] group-hover:brightness-[1.04]"
                  />
                ) : (
                  <div
                    className={cn(
                      `ff-cover-${coverIndex(item.bookKey)}`,
                      "flex aspect-[2/3] w-full items-center justify-center rounded-[10px] transition-[filter] duration-500 ease-out group-hover:brightness-[1.04]",
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

/** Só conteúdo da aba Perfil — não mexe no header. */
function ProfileTab({
  favorites,
  recent,
  onEditFavorites,
}: {
  favorites: FavoriteBook[];
  recent: ShelfItem[];
  onEditFavorites: () => void;
}) {
  const slots: (FavoriteBook | null)[] = [...favorites];
  while (slots.length < 4) slots.push(null);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-white/70">Favoritos</h2>
          <button
            type="button"
            data-snd="select"
            onClick={onEditFavorites}
            className="inline-flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white/70"
          >
            <Pencil className="h-3 w-3" strokeWidth={1.75} />
            Editar
          </button>
        </div>
        <ul className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {slots.map((book, i) => (
            <li key={book?.bookKey ?? `empty-${i}`}>
              {book ? (
                <Tooltip label={book.title}>
                  <Link
                    href={routes.book(
                      bookSlug({ key: book.bookKey, title: book.title }),
                    )}
                    data-snd="select"
                    className="group block overflow-hidden rounded-[10px]"
                  >
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="aspect-[2/3] w-full rounded-[10px] object-cover shadow-[0_14px_32px_-14px_rgba(0,0,0,0.9)] transition-[transform,filter] duration-500 ease-out will-change-transform group-hover:scale-[1.03] group-hover:brightness-[1.04]"
                      />
                    ) : (
                      <div
                        className={cn(
                          `ff-cover-${coverIndex(book.bookKey)}`,
                          "flex aspect-[2/3] w-full items-center justify-center rounded-[10px] transition-[filter] duration-500 ease-out group-hover:brightness-[1.04]",
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
              ) : (
                <button
                  type="button"
                  data-snd="select"
                  onClick={onEditFavorites}
                  className="flex aspect-[2/3] w-full items-center justify-center rounded-[10px] border border-dashed border-white/12 bg-white/[0.02] text-white/30 transition hover:border-white/25 hover:text-white/50"
                  aria-label="Adicionar favorito"
                >
                  +
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-white/70">
          Atividade recente
        </h2>
        {recent.length === 0 ? (
          <p className="py-6 text-sm text-white/40">Nada por aqui ainda.</p>
        ) : (
          <ShelfGrid items={recent} />
        )}
      </section>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, loading, configured, refreshProfile } = useAuth();
  const [shelf, setShelf] = useState<ShelfItem[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);

  useEffect(() => {
    if (!user) {
      setShelf([]);
      return;
    }
    void listShelf(user.uid)
      .then(setShelf)
      .catch(() => setShelf([]));
  }, [user]);

  useEffect(() => {
    setFavorites(normalizeFavorites(profile?.favorites));
  }, [profile?.favorites]);

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

  const recentReads = useMemo(
    () => filterShelf(shelf, "lido").slice(0, 12),
    [shelf],
  );

  if (loading) {
    return <PageLoader />;
  }

  if (!configured) {
    return (
      <AppShell>
        <p className="py-10 text-center text-sm text-white/50">
          Firebase não configurado.
        </p>
      </AppShell>
    );
  }

  if (!user || !profile) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-white/50">Entre para ver seu perfil.</p>
          <Link
            href={routes.login}
            data-snd="select"
            className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-medium text-black"
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
            defaultValue="profile"
            size="lg"
            glass
            contentBoxed={false}
            items={[
              {
                value: "profile",
                label: "Perfil",
                content: (
                  <ProfileTab
                    favorites={favorites}
                    recent={recentReads}
                    onEditFavorites={() => setFavOpen(true)}
                  />
                ),
              },
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

      <EditFavoritesDialog
        open={favOpen}
        onOpenChange={setFavOpen}
        uid={user.uid}
        initial={favorites}
        shelf={shelf}
        onSaved={(next) => {
          setFavorites(next);
          void refreshProfile();
        }}
      />
    </>
  );
}
