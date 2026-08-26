"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { BookActions } from "@/components/books/book-actions";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import {
  formatSubjectLabel,
  subjectSearchQuery,
  type CatalogWork,
} from "@/lib/catalog";
import { coverIndex } from "@/lib/cover-tint";
import { routes } from "@/lib/routes";

type BookStageProps = {
  work: CatalogWork;
  meta: string;
};

export function BookStage({ work, meta }: BookStageProps) {
  return (
    <>
      <HubAtmosphere coverUrl={work.coverUrl ?? null} seed={work.key} />
      <AppShell wide className="relative z-[1] bg-transparent">
        <article className="grid w-full gap-10 pt-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-16 md:pt-10">
          <aside className="mx-auto w-[min(100%,280px)] md:mx-0 md:w-full md:sticky md:top-[76px]">
            {work.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={work.coverUrl}
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
            <BookActions book={work} className="mt-4" />
          </aside>

          <div className="min-w-0 md:pt-1">
            <h1 className="lt-display text-[2rem] leading-[1.12] text-white md:text-[2.6rem]">
              {work.title}
            </h1>
            {meta ? <p className="mt-3 text-sm text-white/40">{meta}</p> : null}

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
