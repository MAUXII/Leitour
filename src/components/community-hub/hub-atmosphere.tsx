"use client";

import { useEffect, useState } from "react";
import {
  coverIndex,
  NEUTRAL_COVER_TINT,
  peekCoverTint,
  placeholderTint,
  sampleCoverTint,
  scrollThumbFromTint,
  scrollThumbHoverFromTint,
} from "@/lib/cover-tint";

const FADE =
  "linear-gradient(180deg, #000 0%, #000 22%, rgba(0,0,0,0.55) 48%, transparent 82%)";

export function HubAtmosphere({
  coverUrl,
  seed,
  soft = false,
  contained = false,
}: {
  coverUrl: string | null;
  seed: string;
  soft?: boolean;
  contained?: boolean;
}) {
  const index = coverIndex(seed);
  const cached = coverUrl ? peekCoverTint(coverUrl) : null;
  const [tint, setTint] = useState(
    cached ?? (coverUrl ? NEUTRAL_COVER_TINT : placeholderTint(seed)),
  );

  useEffect(() => {
    if (!coverUrl) {
      setTint(placeholderTint(seed));
      return;
    }
    const hit = peekCoverTint(coverUrl);
    if (hit) setTint(hit);
    else setTint(NEUTRAL_COVER_TINT);

    let live = true;
    void sampleCoverTint(coverUrl).then((next) => {
      if (!live) return;
      if (next) setTint(next);
    });
    return () => {
      live = false;
    };
  }, [coverUrl, seed]);

  useEffect(() => {
    if (contained) return;
    const root = document.documentElement;
    root.dataset.ffAtmosphere = "tint";
    root.dataset.ltAtmosphere = "tint";
    return () => {
      delete root.dataset.ffAtmosphere;
      delete root.dataset.ltAtmosphere;
    };
  }, [contained]);

  useEffect(() => {
    if (soft || contained) return;
    const root = document.documentElement;
    const thumb = scrollThumbFromTint(tint);
    const thumbHover = scrollThumbHoverFromTint(tint);
    root.style.setProperty("--ff-scroll-thumb", thumb);
    root.style.setProperty("--ff-scroll-thumb-hover", thumbHover);
    root.style.setProperty("--lt-scroll-thumb", thumb);
    root.style.setProperty("--lt-scroll-thumb-hover", thumbHover);
    return () => {
      root.style.removeProperty("--ff-scroll-thumb");
      root.style.removeProperty("--ff-scroll-thumb-hover");
      root.style.removeProperty("--lt-scroll-thumb");
      root.style.removeProperty("--lt-scroll-thumb-hover");
    };
  }, [tint, soft, contained]);

  const wash = contained
    ? "absolute -top-[30%] left-1/2 h-[160%] w-[220%] max-w-none -translate-x-1/2 scale-110 object-cover blur-[90px]"
    : "absolute -top-[20%] left-1/2 h-[110vh] w-[170%] max-w-none -translate-x-1/2 scale-110 object-cover blur-[110px]";

  return (
    <div
      aria-hidden
      className={
        contained
          ? "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-[background] duration-700"
          : "pointer-events-none fixed inset-0 z-0 overflow-hidden transition-[background] duration-700"
      }
      style={{ background: soft ? "var(--ff-bg)" : tint }}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className={`${wash} ${soft ? "opacity-20" : "opacity-70"}`}
          style={{
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        />
      ) : (
        <div
          className={`${wash} ff-cover-${index} ${
            soft ? "opacity-15" : "opacity-55"
          }`}
          style={{
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        />
      )}
      <div
        className={
          soft
            ? "absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"
            : "absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/45"
        }
      />
    </div>
  );
}
