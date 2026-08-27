"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, ImageIcon, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { MorphingInfinity } from "@/components/ui/morphing-infinity";
import { Tooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import type { CatalogWork } from "@/lib/catalog";
import { uploadCoverToCloudinary } from "@/lib/cover-upload";
import { setPersonalCover } from "@/lib/firebase/cover-overrides";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";

type CoverPickerProps = {
  work: CatalogWork;
  /** Capa do catálogo (canônica). */
  catalogCoverUrl?: string;
  /** Capa pessoal atual (se houver). */
  personalCoverUrl?: string;
  onPicked: (url: string) => void;
  className?: string;
};

export function CoverPicker({
  work,
  catalogCoverUrl,
  personalCoverUrl,
  onPicked,
  className,
}: CoverPickerProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [covers, setCovers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        key: work.key,
        title: work.title,
      });
      if (work.authors.length) params.set("authors", work.authors.join("|"));
      if (work.isbn) params.set("isbn", work.isbn);
      if (catalogCoverUrl) params.set("current", catalogCoverUrl);
      const res = await fetch(`/api/books/covers?${params}`);
      const data = (await res.json()) as { covers?: string[]; error?: string };
      setCovers(data.covers ?? []);
      if (!data.covers?.length) {
        setError("Nenhuma capa alternativa no catálogo.");
      }
    } catch {
      setError("Não deu pra carregar as capas.");
      setCovers([]);
    } finally {
      setLoading(false);
    }
  }, [work, catalogCoverUrl]);

  useEffect(() => {
    if (!open) return;
    setSelected(personalCoverUrl ?? catalogCoverUrl ?? null);
    void load();
  }, [open, personalCoverUrl, catalogCoverUrl, load]);

  function onOpenChange(next: boolean) {
    setOpen(next);
  }

  async function confirm() {
    if (!selected || !user) return;
    setSaving(true);
    setError(null);
    try {
      await setPersonalCover(user.uid, work.key, selected);
      playSnd("select");
      onPicked(selected);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não deu pra salvar. Tenta de novo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(file: File | undefined) {
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCoverToCloudinary(file, user.uid, work.key);
      playSnd("select");
      setSelected(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao enviar a imagem.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const canSave = Boolean(user && selected && !saving && !uploading);
  const preview = selected || personalCoverUrl || catalogCoverUrl;
  const gridCovers = (() => {
    const list = [...covers];
    if (selected && !list.includes(selected)) list.unshift(selected);
    else if (
      personalCoverUrl &&
      !list.includes(personalCoverUrl) &&
      !selected
    ) {
      list.unshift(personalCoverUrl);
    }
    return list;
  })();

  return (
    <div className={cn(className)}>
      <Tooltip label="Trocar capa" side="left" className="z-[5]">
        <LiquidGlass className="!rounded-full !bg-black/45 !shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/20">
          <button
            type="button"
            data-snd="select"
            onClick={() => onOpenChange(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-white transition hover:text-white"
            aria-label="Trocar capa"
          >
            <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </LiquidGlass>
      </Tooltip>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-lt-surface="dark"
          className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
            <div className="mx-auto flex min-h-full w-full max-w-[var(--lt-max-width-wide)] flex-col px-5 pb-20 pt-6 sm:px-8">
              <div className="mb-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  data-snd="select"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  data-snd-ignore
                  disabled={!canSave}
                  onClick={() => void confirm()}
                  className="rounded-[12px] bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
                >
                  {saving ? "Salvando…" : "Usar esta"}
                </button>
              </div>

              <DialogTitle className="sr-only">Escolher capa</DialogTitle>

              <div className="grid w-full gap-10 md:grid-cols-[minmax(0,300px)_1fr] md:items-start md:gap-16">
                <aside className="relative z-0 mx-auto w-[min(100%,280px)] md:mx-0 md:w-full">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[12px] bg-white/[0.06] shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)]">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/35">
                        <BookOpen className="h-8 w-8" strokeWidth={1.25} />
                        <span className="px-4 text-center text-xs">
                          Sem capa
                        </span>
                      </div>
                    )}
                  </div>
                </aside>

                <div className="relative z-10 flex min-w-0 flex-col gap-6">
                  <div>
                    <p className="lt-display text-3xl font-medium tracking-tight text-white md:text-4xl">
                      Escolher capa
                    </p>
                    <p className="mt-2 text-sm text-white/40">
                      {work.title}
                      {work.authors[0] ? ` · ${work.authors[0]}` : ""}
                    </p>
                    <p className="mt-2 text-[11px] leading-snug text-white/30">
                      Capa pessoal: só no seu perfil e estante — não muda o
                      catálogo pra todo mundo.
                    </p>
                  </div>

                  {!user ? (
                    <p className="text-sm text-white/50">
                      <Link
                        href={routes.login}
                        className="text-white/80 underline-offset-2 hover:underline"
                      >
                        Entre
                      </Link>{" "}
                      pra salvar uma capa.
                    </p>
                  ) : null}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void onUpload(e.target.files?.[0])}
                  />

                  <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.08em] text-white/35">
                      Catálogo
                    </p>
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <MorphingInfinity className="h-8 w-8 text-white/40" />
                      </div>
                    ) : (
                      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                        <li>
                          <button
                            type="button"
                            disabled={!user || uploading}
                            data-snd="select"
                            onClick={() => fileRef.current?.click()}
                            className={cn(
                              "relative flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[10px] border-2 border-dashed border-white/20 bg-white/[0.03] text-white/45 transition hover:border-white/40 hover:bg-white/[0.06] hover:text-white/75",
                              (!user || uploading) && "cursor-not-allowed opacity-50",
                            )}
                            aria-label="Enviar minha capa"
                          >
                            {uploading ? (
                              <MorphingInfinity className="h-6 w-6" />
                            ) : (
                              <Upload className="h-6 w-6" strokeWidth={1.5} />
                            )}
                            <span className="px-2 text-center text-[11px] font-medium leading-snug">
                              {uploading ? "Enviando…" : "Enviar minha capa"}
                            </span>
                          </button>
                        </li>
                        {gridCovers.map((url) => {
                          const active = selected === url;
                          const isMine =
                            url === personalCoverUrl ||
                            (selected === url && !covers.includes(url));
                          return (
                            <li key={url}>
                              <button
                                type="button"
                                disabled={!user}
                                onClick={() => {
                                  playSnd("select");
                                  setSelected(url);
                                }}
                                className={cn(
                                  "relative block w-full overflow-hidden rounded-[10px] border-2 transition",
                                  active
                                    ? "border-white/70"
                                    : "border-transparent opacity-75 hover:opacity-100",
                                  !user && "cursor-not-allowed opacity-50",
                                )}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt=""
                                  className="aspect-[2/3] w-full object-cover"
                                />
                                {isMine ? (
                                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-white/80">
                                    Sua capa
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {error ? (
                    <p className="text-sm text-red-300/80">{error}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
