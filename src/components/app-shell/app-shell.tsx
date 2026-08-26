import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-[var(--lt-bg)] text-[var(--lt-ink)]",
        className,
      )}
    >
      <div
        className={cn(
          "lt-shell pb-16 pt-[68px] md:pt-[72px]",
          wide && "lt-shell-wide",
        )}
      >
        {children}
      </div>
    </div>
  );
}
