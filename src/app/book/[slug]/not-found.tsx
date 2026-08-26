import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { routes } from "@/lib/routes";

export default function BookNotFound() {
  return (
    <AppShell wide>
      <div className="flex flex-col gap-4 pt-16">
        <h1 className="lt-display text-3xl text-white">Livro não encontrado</h1>
        <p className="text-sm text-white/40">
          Esse endereço não bate com uma obra do catálogo.
        </p>
        <Link
          href={routes.books}
          className="mt-2 text-sm text-white/70 transition hover:text-white"
        >
          Voltar aos livros
        </Link>
      </div>
    </AppShell>
  );
}
