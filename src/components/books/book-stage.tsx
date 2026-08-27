"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AddToShelfButton } from "@/components/books/add-to-shelf-button";
import { BookActions } from "@/components/books/book-actions";
import { CoverPicker } from "@/components/books/cover-picker";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { useAuth } from "@/hooks/useAuth";
import {
  formatSubjectLabel,
  subjectSearchQuery,
  type CatalogWork,
} from "@/lib/catalog";
import { coverIndex } from "@/lib/cover-tint";
import { subscribePersonalCover } from "@/lib/firebase/cover-overrides";
import { routes } from "@/lib/routes";

type BookStageProps = {
  work: CatalogWork;
};

export function BookStage({ work }: BookStageProps) {
  const { user } = useAuth();
  // Catálogo = canônico pra todo mundo; pessoal só pra quem escolheu
  const [personalCover, setPersonalCover] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPersonalCover(null);
      return;
    }
    return subscribePersonalCover(user.uid, work.key, setPersonalCover);
  }, [work.key, user]);

  const displayCover = personalCover ?? work.coverUrl;

  return (
    <>
      <HubAtmosphere coverUrl={displayCover ?? null} seed={work.key} />
      <AppShell wide className="relative z-[1] bg-transparent">
        <article className="grid w-full gap-10 pt-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-16 md:pt-10">
          <aside className="relative mx-auto w-[min(100%,280px)] md:mx-0 md:w-full md:sticky md:top-[76px]">
            <div className="group relative z-0">
              {displayCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayCover}
                  alt=""
                  className="aspect-[2/3] w-full rounded-[12px] object-cover shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)]"
                />
              ) : (
                <div
                  className={`ff-cover-${coverIndex(work.key)} flex aspect-[2/3] w-full items-center justify-center rounded-[12px]`}
                >
                  <BookOpen
                    className="h-10 w-10 text-white/20"
                    strokeWidth={1.25}
                  />
                </div>
              )}
              <div className="pointer-events-none absolute right-1.5 top-1.5 z-[2] flex flex-col gap-1.5 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                <CoverPicker
                  work={work}
                  catalogCoverUrl={work.coverUrl}
                  personalCoverUrl={personalCover ?? undefined}
                  onPicked={setPersonalCover}
                />
                <LiquidGlass className="!rounded-full !bg-black/45 !shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/20">
                  <AddToShelfButton
                    book={{
                      ...work,
                      coverUrl: displayCover ?? work.coverUrl,
                    }}
                    variant="icon"
                    tooltipSide="left"
                    className="[&_button]:text-white"
                  />
                </LiquidGlass>
              </div>
            </div>
            <BookActions
              book={{ ...work, coverUrl: displayCover ?? work.coverUrl }}
              className="relative z-10 mt-4"
            />
          </aside>

          <div className="min-w-0 md:pt-1">
            <h1 className="lt-display text-[2rem] leading-[1.12] text-white md:text-[2.6rem]">
              {work.title}
            </h1>
            {(work.year || work.authors.length > 0) && (
              <p className="mt-3 text-sm text-white/40">
                {work.year ? <span>{work.year}</span> : null}
                {work.year && work.authors.length > 0 ? (
                  <span className="mx-2 text-white/25">·</span>
                ) : null}
                {work.authors.map((author, i) => (
                  <span key={`${author}-${i}`}>
                    {i > 0 ? ", " : null}
                    <Link
                      href={routes.author(author)}
                      data-snd="select"
                      className="text-white/55 transition hover:text-white"
                    >
                      {author}
                    </Link>
                  </span>
                ))}
              </p>
            )}

            {work.description ? (
              <p className="mt-8 max-w-[36rem] text-[15px] font-light leading-7 text-white/55 whitespace-pre-wrap">
                {work.description}
              </p>
            ) : (
              <p className="mt-8 max-w-[36rem] text-[15px] font-light leading-7 text-white/30">
                Sem sinopse neste catálogo.
              </p>
            )}

            {work.subjects.length > 0 ? (
              <ul className="mt-8 flex max-w-[36rem] flex-wrap gap-2">
                {work.subjects.map((subject) => (
                  <li key={subject}>
                    <LiquidGlass className="rounded-xl">
                      <Link
                        href={routes.booksSearch(subjectSearchQuery(subject))}
                        data-snd="select"
                        className="inline-flex items-center px-3.5 py-1.5 text-[12px] font-medium tracking-[-0.01em] text-white/70 transition hover:text-white"
                      >
                        {formatSubjectLabel(subject)}
                      </Link>
                    </LiquidGlass>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </article>
      </AppShell>
    </>
  );
}
