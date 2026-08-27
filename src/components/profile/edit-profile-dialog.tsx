"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { Camera } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveProfileEdit } from "@/lib/account-bootstrap";
import type { UserProfile } from "@/lib/firebase/users";
import { playSnd } from "@/lib/snd";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  profile: UserProfile;
  onSaved: () => Promise<void> | void;
};

export function EditProfileDialog({
  open,
  onOpenChange,
  user,
  profile,
  onSaved,
}: EditProfileDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [preview, setPreview] = useState<string | null>(
    profile.photoURL || user.photoURL || null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(profile.displayName);
    setBio(profile.bio || "");
    setPreview(profile.photoURL || user.photoURL || null);
    setFile(null);
    setError(null);
  }, [open, profile, user.photoURL]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      playSnd("caution");
      setError("Escolha uma imagem.");
      return;
    }
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setError(null);
  }

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (name.trim().length < 2) {
      playSnd("caution");
      setError("Nome curto demais.");
      return;
    }
    setBusy(true);
    setError(null);
    playSnd("select");
    try {
      await saveProfileEdit({
        user,
        displayName: name,
        bio,
        file,
        existingPhotoURL: profile.photoURL || user.photoURL || null,
      });
      await onSaved();
      playSnd("celebration");
      onOpenChange(false);
    } catch (err) {
      playSnd("caution");
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setBusy(false);
    }
  }

  const canSave = name.trim().length >= 2 && !busy;
  const initials =
    (name.trim() || profile.displayName || "?").slice(0, 2).toUpperCase();

  return (
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
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mx-auto flex min-h-full w-full max-w-[var(--lt-max-width-wide)] flex-col px-5 pb-20 pt-6 sm:px-8"
          >
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
                type="submit"
                data-snd-ignore
                disabled={!canSave}
                className="rounded-[12px] bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
              >
                {busy ? "Salvando…" : "Salvar"}
              </button>
            </div>

            <DialogTitle className="sr-only">Editar perfil</DialogTitle>

            <div className="grid w-full gap-10 md:grid-cols-[minmax(0,220px)_1fr] md:items-start md:gap-14">
              <aside className="mx-auto w-[min(100%,200px)] md:mx-0 md:w-full">
                <button
                  type="button"
                  data-snd="select"
                  onClick={() => fileRef.current?.click()}
                  className="group relative aspect-square w-full overflow-hidden rounded-[18px] bg-white/[0.06] shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)] transition hover:bg-white/[0.09]"
                  aria-label="Trocar foto"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:brightness-110"
                    />
                  ) : (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/35">
                      <Camera className="h-8 w-8" strokeWidth={1.25} />
                      <span className="text-xs">{initials}</span>
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-3 text-center text-xs text-white/80 opacity-0 transition group-hover:opacity-100">
                    Trocar foto
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPick}
                />
              </aside>

              <div className="flex min-w-0 flex-col gap-6">
                <div>
                  <p className="lt-display text-3xl font-medium tracking-tight text-white md:text-4xl">
                    Seu perfil
                  </p>
                  <p className="mt-2 text-sm text-white/40">
                    Nome, foto e bio — visíveis no hub.
                  </p>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-white/35">
                    Nome
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={40}
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value.replace(/^@+/, ""))
                    }
                    placeholder="Seu nome"
                    className="w-full border-0 bg-transparent pb-1 text-2xl font-medium tracking-tight text-white outline-none placeholder:text-white/25"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-white/35">
                    Bio
                  </span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 280))}
                    rows={4}
                    maxLength={280}
                    placeholder="Uma linha sobre você…"
                    className="w-full resize-none border-0 bg-transparent pb-1 text-[15px] font-light leading-7 text-white/80 outline-none placeholder:text-white/25"
                  />
                  <span className="text-right text-[11px] text-white/30">
                    {bio.length}/280
                  </span>
                </label>

                {error ? (
                  <p className="text-sm text-red-300/90" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
