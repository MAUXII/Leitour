"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { needsOnboarding } from "@/lib/firebase/users";
import { routes } from "@/lib/routes";

/** Força onboarding incompleto a terminar antes de usar o app. */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) return;
    if (!needsOnboarding(profile)) return;

    const onAuth =
      pathname === routes.login ||
      pathname === routes.signup ||
      pathname === routes.onboarding ||
      pathname?.startsWith("/auth/");

    if (!onAuth) {
      router.replace(routes.onboarding);
    }
  }, [user, profile, loading, pathname, router]);

  return children;
}
