"use client";

import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { CatalogBook } from "@/lib/catalog";
import {
  removeShelfItem,
  subscribeShelfItem,
  upsertShelfItem,
  type ShelfItem,
  type ShelfStatus,
} from "@/lib/firebase/shelf";
import { routes } from "@/lib/routes";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MENU: Array<{ status: ShelfStatus; label: string }> = [
  { status: "quero_ler", label: "Quero ler" },
  { status: "lendo", label: "Lendo agora" },
  { status: "lido", label: "Lido" },
];

const primaryClass =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-white px-5 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-black transition hover:bg-white/92 disabled:bg-white/70 disabled:text-black/50";

const ghostClass =
  "w-full rounded-[12px] px-5 py-3 text-center text-[15px] font-medium tracking-[-0.01em] transition hover:bg-white/[0.06] disabled:opacity-40";

export function BookActions({
  book,
  className,
}: {
  book: CatalogBook;
  className?: string;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [item, setItem] = useState<ShelfItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setItem(null);
      return;
    }
    return subscribeShelfItem(user.uid, book.key, setItem);
  }, [user, book.key]);

  async function setStatus(status: ShelfStatus) {
    if (!user) {
      playSnd("caution");
      setToast("Entre para salvar na estante.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setToast(null);
    playSnd("select");
    try {
      await upsertShelfItem(user.uid, book, status);
      playSnd("celebration");
      setMenuOpen(false);
    } catch (err) {
      playSnd("caution");
      setToast(
        err instanceof Error ? err.message : "Falha ao salvar na estante.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!user || busy) return;
    setBusy(true);
    setToast(null);
    playSnd("select");
    try {
      await removeShelfItem(user.uid, book.key);
      setMenuOpen(false);
    } catch (err) {
      playSnd("caution");
      setToast(
        err instanceof Error ? err.message : "Falha ao tirar da estante.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onToggleRead() {
    if (item?.status === "lido") {
      await setStatus("quero_ler");
      return;
    }
    await setStatus("lido");
  }

  const readOn = item?.status === "lido";

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      {item ? (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-snd-ignore
              disabled={busy}
              className={primaryClass}
              aria-label="Gerenciar estante"
            >
              Na estante
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-black/45 transition",
                  menuOpen && "rotate-180",
                )}
                strokeWidth={2}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            className="w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden p-0"
          >
            <p
              className="animate-menu-rise px-3.5 pb-1 pt-2.5 text-[11px] uppercase tracking-[0.08em] text-white/35 motion-reduce:animate-none"
              style={{ animationDelay: "20ms" }}
            >
              Nesta estante
            </p>
            {MENU.map((opt, i) => {
              const active = item.status === opt.status;
              return (
                <button
                  key={opt.status}
                  type="button"
                  data-snd-ignore
                  disabled={busy}
                  onClick={() => {
                    if (active) {
                      setMenuOpen(false);
                      return;
                    }
                    void setStatus(opt.status);
                  }}
                  className="animate-menu-rise flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm text-white transition hover:bg-white/5 motion-reduce:animate-none"
                  style={{ animationDelay: `${60 + i * 45}ms` }}
                >
                  {opt.label}
                  {active ? (
                    <Check
                      className="h-4 w-4 shrink-0 text-white"
                      strokeWidth={2}
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0" />
                  )}
                </button>
              );
            })}
            <div
              className="animate-menu-rise mt-1 h-px w-full bg-white/10 motion-reduce:animate-none"
              style={{ animationDelay: "200ms" }}
            />
            <button
              type="button"
              data-snd-ignore
              disabled={busy}
              onClick={() => void onRemove()}
              className="animate-menu-rise flex w-full items-center px-3.5 py-2.5 text-left text-sm text-white transition hover:bg-red-500/15 hover:text-red-400 motion-reduce:animate-none"
              style={{ animationDelay: "240ms" }}
            >
              Remover da estante
            </button>
          </PopoverContent>
        </Popover>
      ) : (
        <button
          type="button"
          data-snd-ignore
          onClick={() => void setStatus("quero_ler")}
          disabled={busy}
          className={primaryClass}
        >
          {busy ? "Salvando…" : "Adicionar à estante"}
        </button>
      )}

      <button
        type="button"
        data-snd-ignore
        onClick={() => void onToggleRead()}
        disabled={busy}
        aria-pressed={readOn}
        className={cn(
          ghostClass,
          readOn
            ? "text-white"
            : "text-white/55 hover:text-white",
        )}
      >
        Marcar como lido
      </button>

      <Link
        href={routes.publishBook(
          {
            title: book.title,
            key: book.key,
            coverUrl: book.coverUrl,
            authors: book.authors,
          },
          pathname || "/feed",
        )}
        data-snd="select"
        className={cn(ghostClass, "text-white/55 hover:text-white")}
      >
        Escrever review
      </Link>

      {toast ? (
        <p className="mt-1 text-center text-xs text-white/40">{toast}</p>
      ) : null}
    </div>
  );
}
