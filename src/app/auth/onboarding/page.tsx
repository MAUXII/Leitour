"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import {
  AppMarkLink,
  AUTH_ATMOSPHERE_CLASS,
} from "@/components/brand/app-logo";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { PageLoader } from "@/components/ui/morphing-infinity";
import { useAuth } from "@/hooks/useAuth";
import { finishOnboarding } from "@/lib/account-bootstrap";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, configured, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!configured) return;
    if (!user) {
      router.replace(routes.signup);
      return;
    }
    if (profile?.onboardingComplete) {
      router.replace(routes.feed);
      return;
    }
    setName(profile?.displayName || user.displayName || "");
    // Google já traz photoURL https — usa direto
    setPreview(profile?.photoURL || user.photoURL || null);
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [user, profile, loading, configured, router]);

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

  async function saveProfile(opts: { withNewPhoto: boolean }) {
    if (!user) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      playSnd("caution");
      setError("Nome curto demais.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await finishOnboarding({
        user,
        displayName: trimmed,
        file: opts.withNewPhoto ? file : null,
        existingPhotoURL: profile?.photoURL || user.photoURL || null,
      });
      await refreshProfile();
      playSnd("celebration");
      router.replace(routes.feed);
      router.refresh();
    } catch (err) {
      playSnd("caution");
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o perfil.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await saveProfile({ withNewPhoto: true });
  }

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--lt-bg)] text-white">
      <div aria-hidden className={AUTH_ATMOSPHERE_CLASS} />

      <AppMarkLink className="absolute left-5 top-5 z-10 md:left-8 md:top-8" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-20 md:pt-24">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Seu perfil
        </h1>
        <p className="mt-3 text-base text-white/40">
          Foto e usuário — com Google a foto já vem da conta.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-12 flex flex-1 flex-col gap-8"
        >
          <div className="flex items-center gap-4">
            <button
              type="button"
              data-snd="select"
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.06] transition hover:bg-white/[0.1]"
              aria-label="Escolher foto"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-6 w-6 text-white/30" strokeWidth={1.5} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPick}
            />

            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="select-none text-2xl font-medium text-white/20">
                @
              </span>
              <input
                ref={nameRef}
                required
                minLength={2}
                maxLength={40}
                autoComplete="username"
                placeholder="usuario"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/^@+/, ""))}
                className="min-w-0 flex-1 bg-transparent text-2xl font-medium tracking-tight text-white outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-red-300/90" role="alert">
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-6">
            <button
              type="submit"
              disabled={busy}
              data-snd={busy ? "disabled" : "button"}
              className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {busy ? "Salvando…" : "Continuar"}
            </button>
            <LiquidGlass className="w-full rounded-2xl">
              <button
                type="button"
                disabled={busy || name.trim().length < 2}
                data-snd={
                  busy || name.trim().length < 2 ? "disabled" : "tap5"
                }
                onClick={() => void saveProfile({ withNewPhoto: false })}
                className="w-full px-5 py-4 text-sm font-medium text-white/70 transition hover:text-white disabled:opacity-40"
              >
                Continuar sem trocar a foto
              </button>
            </LiquidGlass>
          </div>
        </form>
      </div>
    </main>
  );
}
