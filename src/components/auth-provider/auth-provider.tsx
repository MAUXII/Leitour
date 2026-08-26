"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import {
  ensureUserProfile,
  getUserProfile,
  type UserProfile,
} from "@/lib/firebase/users";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  configured: false,
  refreshProfile: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);

  const refreshProfile = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      setProfile(null);
      return;
    }
    const p = await getUserProfile(current.uid);
    setProfile(p);
  }, []);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(getFirebaseAuth(), async (next) => {
      setUser(next);
      if (!next) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const p = await ensureUserProfile(next);
        setProfile(p);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [configured]);

  const value = useMemo(
    () => ({ user, profile, loading, configured, refreshProfile }),
    [user, profile, loading, configured, refreshProfile],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
