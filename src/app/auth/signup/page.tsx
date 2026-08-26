"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { User } from "firebase/auth";
import {
  AuthDivider,
  GoogleSignInButton,
} from "@/components/auth/google-button";
import { AUTH_FIELD_CLASS } from "@/components/auth/field-styles";
import {
  AppMarkLink,
  AUTH_ATMOSPHERE_CLASS,
} from "@/components/brand/app-logo";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { useAuth } from "@/hooks/useAuth";
import { APP_TAGLINE } from "@/lib/brand";
import { afterAuth } from "@/lib/account-bootstrap";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";

export default function SignupPage() {
  const router = useRouter();
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finishOk(user: User) {
    const { nextRoute } = await afterAuth(user);
    playSnd("celebration");
    router.replace(nextRoute);
    router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await signUpWithEmail({ email, password });
      await finishOk(user);
    } catch (err) {
      playSnd("caution");
      setError(
        err instanceof Error ? err.message : "Não foi possível criar a conta.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      const user = await signInWithGoogle();
      await finishOk(user);
    } catch (err) {
      playSnd("caution");
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível continuar com Google.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--lt-bg)] text-white">
      <div aria-hidden className={AUTH_ATMOSPHERE_CLASS} />

      <AppMarkLink className="absolute left-5 top-5 z-10 md:left-8 md:top-8" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-20 md:pt-24">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Criar conta
        </h1>
        <p className="mt-3 text-base text-white/40">{APP_TAGLINE}</p>

        {!configured && (
          <p className="mt-6 text-sm text-sky-200/90">
            Firebase ainda sem chaves. Preencha{" "}
            <code className="text-white/80">.env.local</code>.
          </p>
        )}

        <form
          onSubmit={onSubmit}
          className="mt-12 flex flex-1 flex-col gap-8"
        >
          <div className="flex flex-col gap-5">
            <GoogleSignInButton
              onClick={() => void onGoogle()}
              disabled={busy || !configured}
            />
            <AuthDivider />

            <LiquidGlass className="w-full rounded-2xl">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={AUTH_FIELD_CLASS}
              />
            </LiquidGlass>

            <LiquidGlass className="w-full rounded-2xl">
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={AUTH_FIELD_CLASS}
              />
            </LiquidGlass>

            {error && (
              <p className="text-sm text-red-300/90" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-5 pt-6">
            <button
              type="submit"
              disabled={busy || !configured}
              data-snd={busy || !configured ? "disabled" : "button"}
              className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {busy ? "Criando…" : "Continuar"}
            </button>
            <p className="text-center text-sm text-white/35">
              Já tem conta?{" "}
              <Link
                href={routes.login}
                className="font-medium text-white/70 transition hover:text-white"
              >
                Entrar
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
