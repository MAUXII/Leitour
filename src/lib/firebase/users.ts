import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "@/lib/firebase/client";

export type FavoriteBook = {
  bookKey: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  year?: number;
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  handle: string;
  bio: string;
  photoURL: string | null;
  onboardingComplete: boolean;
  /** Até 4 favoritos (estilo Letterboxd). */
  favorites?: FavoriteBook[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

function defaultHandle(user: User, displayName?: string): string {
  const base =
    displayName?.trim().toLowerCase().replace(/\s+/g, "") ||
    user.displayName?.trim().toLowerCase().replace(/\s+/g, "") ||
    user.email?.split("@")[0] ||
    "leitor";
  return `@${base.slice(0, 24)}`;
}

export function needsOnboarding(profile: UserProfile | null): boolean {
  return !profile?.onboardingComplete;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(getDb(), "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    return {
      ...data,
      onboardingComplete: Boolean(data.onboardingComplete),
      favorites: normalizeFavorites(data.favorites),
    };
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "",
    handle: defaultHandle(user),
    bio: "",
    photoURL: user.photoURL,
    onboardingComplete: false,
  };

  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getDb(), "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfile;
  return {
    ...data,
    onboardingComplete: Boolean(data.onboardingComplete),
    favorites: normalizeFavorites(data.favorites),
  };
}

export async function completeOnboarding(
  uid: string,
  input: { displayName: string; photoURL?: string | null },
): Promise<UserProfile> {
  const ref = doc(getDb(), "users", uid);
  const displayName = input.displayName.trim();
  const handle = `@${displayName.toLowerCase().replace(/\s+/g, "").slice(0, 24) || "leitor"}`;

  await updateDoc(ref, {
    displayName,
    handle,
    photoURL: input.photoURL ?? null,
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
  });

  const next = await getUserProfile(uid);
  if (!next) throw new Error("Perfil não encontrado após onboarding");
  return next;
}

/** Atualiza nome, bio e foto do leitor. */
export async function updateUserProfile(
  uid: string,
  input: {
    displayName: string;
    bio?: string;
    photoURL?: string | null;
  },
): Promise<UserProfile> {
  const ref = doc(getDb(), "users", uid);
  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    throw new Error("Nome curto demais.");
  }
  const bio = (input.bio ?? "").trim().slice(0, 280);
  const handle = `@${displayName.toLowerCase().replace(/\s+/g, "").slice(0, 24) || "leitor"}`;

  const payload: {
    displayName: string;
    handle: string;
    bio: string;
    updatedAt: ReturnType<typeof serverTimestamp>;
    photoURL?: string | null;
  } = {
    displayName,
    handle,
    bio,
    updatedAt: serverTimestamp(),
  };
  if (input.photoURL !== undefined) {
    payload.photoURL = input.photoURL;
  }

  await updateDoc(ref, payload);

  const next = await getUserProfile(uid);
  if (!next) throw new Error("Perfil não encontrado após salvar");
  return next;
}

const FAVORITES_MAX = 4;

export function normalizeFavorites(
  list: FavoriteBook[] | undefined | null,
): FavoriteBook[] {
  if (!Array.isArray(list)) return [];
  const out: FavoriteBook[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const bookKey = String(raw.bookKey || "").trim();
    const title = String(raw.title || "").trim();
    if (!bookKey || !title || seen.has(bookKey)) continue;
    seen.add(bookKey);
    out.push({
      bookKey,
      title,
      authors: Array.isArray(raw.authors)
        ? raw.authors.map(String).filter(Boolean)
        : [],
      coverUrl: raw.coverUrl || undefined,
      year: typeof raw.year === "number" ? raw.year : undefined,
    });
    if (out.length >= FAVORITES_MAX) break;
  }
  return out;
}

/** Substitui a lista de favoritos (0–4). */
export async function updateUserFavorites(
  uid: string,
  favorites: FavoriteBook[],
): Promise<UserProfile> {
  const ref = doc(getDb(), "users", uid);
  const cleaned = normalizeFavorites(favorites);
  await updateDoc(ref, {
    favorites: cleaned,
    updatedAt: serverTimestamp(),
  });
  const next = await getUserProfile(uid);
  if (!next) throw new Error("Perfil não encontrado após favoritos");
  return { ...next, favorites: cleaned };
}
