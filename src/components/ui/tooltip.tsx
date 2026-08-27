"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
};

/** Tooltip simples no hover — segue o tema (claro/escuro). */
export function Tooltip({
  label,
  children,
  className,
  side = "top",
}: TooltipProps) {
  const [open, setOpen] = useState(false);

  const position =
    side === "top"
      ? "bottom-full left-1/2 mb-2"
      : side === "bottom"
        ? "top-full left-1/2 mt-2"
        : side === "left"
          ? "right-full top-1/2 mr-2"
          : "left-full top-1/2 ml-2";

  const initial =
    side === "top"
      ? { opacity: 0, y: 4, x: "-50%" }
      : side === "bottom"
        ? { opacity: 0, y: -4, x: "-50%" }
        : side === "left"
          ? { opacity: 0, x: 4, y: "-50%" }
          : { opacity: 0, x: -4, y: "-50%" };

  const animate =
    side === "top" || side === "bottom"
      ? { opacity: 1, y: 0, x: "-50%" }
      : { opacity: 1, x: 0, y: "-50%" };

  const exit =
    side === "top"
      ? { opacity: 0, y: 2, x: "-50%" }
      : side === "bottom"
        ? { opacity: 0, y: -2, x: "-50%" }
        : side === "left"
          ? { opacity: 0, x: 2, y: "-50%" }
          : { opacity: 0, x: -2, y: "-50%" };

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && label ? (
          <motion.div
            role="tooltip"
            data-lt-tooltip=""
            initial={initial}
            animate={{ ...animate, transition: { duration: 0.12 } }}
            exit={exit}
            className={cn(
              "pointer-events-none absolute z-[90] rounded-md bg-black/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
              position,
            )}
          >
            <span className="block max-w-[220px] truncate text-center">
              {label}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
