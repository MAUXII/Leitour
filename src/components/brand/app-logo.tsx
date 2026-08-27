import Link from "next/link";
import { APP_LOGO_SRC, APP_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type AppMarkProps = {
  href?: string;
  className?: string;
  /** Tamanho do ícone em px (default 24). */
  size?: number;
};

export function AppMarkLink({
  href = routes.feed,
  className,
  size = 24,
}: AppMarkProps) {
  return (
    <Link
      href={href}
      aria-label={`${APP_NAME} home`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition hover:opacity-90",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={APP_LOGO_SRC}
        alt={APP_NAME}
        width={size}
        height={size}
        className="block rounded-[8px] object-cover"
        style={{ width: size, height: size }}
        decoding="async"
      />
    </Link>
  );
}

/** Glow de canto — azul pastel (#1358E3). */
export const AUTH_ATMOSPHERE_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_100%_at_20%_0%,rgba(19,88,227,0.18),transparent_60%)]";
