import Link from "next/link";
import { APP_MARK, APP_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type AppMarkProps = {
  href?: string;
  className?: string;
};

export function AppMarkLink({
  href = routes.discover,
  className,
}: AppMarkProps) {
  return (
    <Link
      href={href}
      aria-label={`${APP_NAME} home`}
      className={cn(
        "text-sm font-medium lowercase tracking-tight text-white/70 transition hover:text-white",
        className,
      )}
    >
      {APP_MARK}
    </Link>
  );
}

/** Glow de canto — azul pastel (#1358E3). */
export const AUTH_ATMOSPHERE_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_100%_at_20%_0%,rgba(19,88,227,0.18),transparent_60%)]";
