"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronRight, LogOut } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { PageLoader } from "@/components/ui/morphing-infinity";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase/auth";
import { routes } from "@/lib/routes";
import { isSndMuted, playSnd, setSndMuted } from "@/lib/snd";
import { cn } from "@/lib/utils";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xs font-medium uppercase tracking-[0.1em] text-white/35">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        {children}
      </div>
    </section>
  );
}

function Row({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const base = cn(
    "flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]",
    className,
  );
  if (href) {
    return (
      <Link href={href} data-snd="select" className={base}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

function Divider() {
  return <div className="mx-4 h-px bg-white/[0.06]" />;
}

function SoundToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-snd={on ? "toggleOff" : "toggleOn"}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        on ? "bg-white" : "bg-white/15",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow transition-transform duration-200",
          on ? "translate-x-5 bg-black" : "translate-x-0 bg-white/90",
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, loading, configured, refreshProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    setSoundOn(!isSndMuted());
  }, []);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const lightOn = themeReady && (resolvedTheme ?? theme) === "light";

  if (loading) {
    return <PageLoader />;
  }

  if (!configured) {
    return (
      <AppShell>
        <p className="text-sm text-amber-200/90">
          Configure o Firebase para usar as configurações.
        </p>
      </AppShell>
    );
  }

  if (!user || !profile) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-white">
            Entre para ver as configurações
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
  const initials = (profile.displayName || "?").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-10">
        <header>
          <h1 className="lt-display text-[2rem] font-medium tracking-tight text-white">
            Configurações
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Conta, som e sessão — o perfil público fica em outro lugar.
          </p>
        </header>

        <Section title="Conta">
          <Row onClick={() => { playSnd("select"); setEditOpen(true); }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="h-11 w-11 shrink-0 rounded-[12px] object-cover bg-white/10"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/10 text-sm font-medium text-white/70">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-white">
                {profile.displayName || "Leitor"}
              </p>
              <p className="truncate text-sm text-white/40">{profile.handle}</p>
            </div>
            <span className="text-sm text-white/45">Editar</span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-white/30"
              strokeWidth={1.5}
            />
          </Row>
          <Divider />
          <Row>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-white">Email</p>
              <p className="mt-0.5 truncate text-sm text-white/40">
                {user.email || "—"}
              </p>
            </div>
          </Row>
          <Divider />
          <Row href={routes.profile}>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-white">Ver perfil público</p>
              <p className="mt-0.5 text-sm text-white/40">
                Estante, bio e publicações
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-white/30"
              strokeWidth={1.5}
            />
          </Row>
        </Section>

        <Section title="Preferências">
          <Row>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-white">Sons da interface</p>
              <p className="mt-0.5 text-sm text-white/40">
                Taps e feedback ao navegar
              </p>
            </div>
            <SoundToggle
              on={soundOn}
              onChange={(next) => {
                setSoundOn(next);
                setSndMuted(!next);
                if (next) playSnd("toggleOn");
              }}
            />
          </Row>
          <Divider />
          <Row>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-white">Tema claro</p>
              <p className="mt-0.5 text-sm text-white/40">
                Fundo claro na interface
              </p>
            </div>
            <SoundToggle
              on={lightOn}
              onChange={(next) => {
                playSnd(next ? "toggleOn" : "toggleOff");
                setTheme(next ? "light" : "dark");
              }}
            />
          </Row>
          <Divider />
          <Row className="opacity-55">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-white">Notificações</p>
              <p className="mt-0.5 text-sm text-white/40">Em breve</p>
            </div>
          </Row>
        </Section>

        <Section title="Sessão">
          <Row
            onClick={() => {
              playSnd("caution");
              void signOutUser().then(() => router.replace(routes.login));
            }}
            className="text-red-300/90 hover:bg-red-500/[0.06]"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-[15px] font-medium">Sair da conta</span>
          </Row>
        </Section>
      </div>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        profile={profile}
        onSaved={refreshProfile}
      />
    </AppShell>
  );
}
