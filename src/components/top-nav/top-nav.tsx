"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Compass,
  LayoutGrid,
  Bell,
  Menu,
  X,
  User,
  Bookmark,
  LogOut,
} from "lucide-react";
import { APP_MARK, APP_NAME } from "@/lib/brand";
import { isBookPath, routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { playSnd } from "@/lib/snd";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase/auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ICON_STROKE = 1.5;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AccountMenu({
  onClose,
  onLogout,
}: {
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <Link
        href={routes.profile}
        onClick={onClose}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/5"
      >
        <User className="h-4 w-4 shrink-0 text-white/55" strokeWidth={1.5} />
        Ver perfil
      </Link>
      <Link
        href={routes.saved}
        onClick={onClose}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/5"
      >
        <Bookmark className="h-4 w-4 shrink-0 text-white/55" strokeWidth={1.5} />
        Itens salvos
      </Link>
      <button
        type="button"
        data-snd="caution"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/5"
      >
        <LogOut className="h-4 w-4 shrink-0 text-white/55" strokeWidth={1.5} />
        Sair
      </button>
    </>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [timeLabel, setTimeLabel] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navReady = useRef(false);

  const isAuthPath =
    pathname === routes.login ||
    pathname === routes.signup ||
    pathname?.startsWith("/auth/");

  const navLinks = [
    { href: routes.feed, label: "Feed", icon: LayoutGrid },
    { href: routes.books, label: "Livros", icon: BookOpen },
    { href: routes.discover, label: "Descobrir", icon: Compass },
  ] as const;

  const wideNav =
    pathname === routes.publish || isBookPath(pathname);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hh = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo",
      });
      setTimeLabel(`${hh} BRT`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    const next = wideNav ? "960px" : "820px";
    const pad = wideNav ? "0px" : "16px";
    if (!navReady.current) {
      navReady.current = true;
      document.documentElement.style.setProperty("--lt-nav-w", next);
      document.documentElement.style.setProperty("--lt-content-pad-x", pad);
      return;
    }
    let timeout = 0;
    const frame = window.requestAnimationFrame(() => {
      timeout = window.setTimeout(() => {
        document.documentElement.style.setProperty("--lt-nav-w", next);
        document.documentElement.style.setProperty("--lt-content-pad-x", pad);
      }, 80);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [wideNav]);

  if (isAuthPath || loading) {
    return null;
  }

  const iconClass = "h-4 w-4";
  const handleLogout = () => {
    void signOutUser();
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[border-color,background-color,backdrop-filter] duration-200",
          scrolled
            ? "border-white/10 bg-[var(--lt-bg)]/55 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(ellipse_80%_120%_at_12%_0%,rgba(19,88,227,0.16),transparent_55%)] transition-opacity duration-300 [[data-lt-atmosphere=tint]_&]:opacity-0 [[data-ff-atmosphere=tint]_&]:opacity-0"
        />
        <nav className="relative lt-nav">
          <Link
            href={routes.feed}
            aria-label={`${APP_NAME} Home`}
            className="flex shrink-0 items-center text-[15px] font-medium lowercase tracking-tight text-white"
          >
            {APP_MARK}
          </Link>
          <div className="lt-center-and-right">
            <div className="lt-nav-links">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    data-active={active}
                    className="lt-nav-link"
                  >
                    <Icon className={iconClass} strokeWidth={ICON_STROKE} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-xs tabular-nums text-white/40 sm:inline">
                {timeLabel}
              </span>
              <Link
                href={routes.publish}
                className="hidden px-2 py-1 text-sm font-medium text-white/80 transition hover:text-white sm:inline"
              >
                Publicar
              </Link>
              {user ? (
                <>
                  <button
                    type="button"
                    className="hidden rounded-md p-1.5 text-white/45 transition hover:bg-white/5 hover:text-white md:inline-flex"
                    aria-label="Notificações"
                  >
                    <Bell className={iconClass} strokeWidth={ICON_STROKE} />
                  </button>
                  <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        data-snd="tap5"
                        className="hidden overflow-hidden rounded-full md:inline-flex"
                        aria-label="Perfil"
                      >
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.photoURL}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                            <User
                              className="h-3.5 w-3.5"
                              strokeWidth={ICON_STROKE}
                            />
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      sideOffset={8}
                      className="w-[min(100vw-2rem,240px)] overflow-hidden p-1.5"
                    >
                      <AccountMenu
                        onClose={() => setAccountOpen(false)}
                        onLogout={handleLogout}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              ) : (
                <Link
                  href={routes.login}
                  className="hidden px-2 py-1 text-sm font-medium text-white/80 transition hover:text-white sm:inline"
                >
                  Entrar
                </Link>
              )}
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 text-white/70 md:hidden"
                onClick={() =>
                  setMobileOpen((v) => {
                    playSnd(v ? "toggleOff" : "toggleOn");
                    return !v;
                  })
                }
                aria-label="Menu"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" strokeWidth={ICON_STROKE} />
                ) : (
                  <Menu className="h-5 w-5" strokeWidth={ICON_STROKE} />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--lt-bg)] pt-14 md:hidden">
          <div className="flex flex-col gap-1 px-4 pt-2">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/80"
              >
                <Icon className="h-5 w-5" strokeWidth={ICON_STROKE} />
                {label}
              </Link>
            ))}
            <Link
              href={routes.publish}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/80"
            >
              Publicar
            </Link>
            {user ? (
              <div className="mt-2 flex flex-col gap-0.5">
                <AccountMenu
                  onClose={() => setMobileOpen(false)}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <Link
                href={routes.login}
                onClick={() => setMobileOpen(false)}
                className="mt-4 rounded-xl px-3 py-3 text-white/80"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
