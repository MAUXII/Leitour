"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
};

/** Tooltip simples no hover. */
export function Tooltip({
  label,
  children,
  className,
  side = "top",
}: TooltipProps) {
  const [open, setOpen] = useState(false);

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
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, x: "-50%" }}
            animate={{
              opacity: 1,
              y: 0,
              x: "-50%",
              transition: { duration: 0.12 },
            }}
            exit={{ opacity: 0, y: side === "top" ? 2 : -2, x: "-50%" }}
            className={cn(
              "pointer-events-none absolute left-1/2 z-[90] rounded-md bg-black/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
              side === "top" ? "bottom-full mb-2" : "top-full mt-2",
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
