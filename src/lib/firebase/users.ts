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

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  handle: string;
  bio: string;
  photoURL: string | null;
  onboardingComplete: boolean;
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
