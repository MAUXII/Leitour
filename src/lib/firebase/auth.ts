import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/firebase/users";

export async function signUpWithEmail(input: {
  email: string;
  password: string;
}): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password,
  );
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function updateAuthProfile(input: {
  displayName: string;
  photoURL?: string | null;
}): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Não autenticado");

  const payload: { displayName: string; photoURL?: string } = {
    displayName: input.displayName.trim(),
  };

  // Auth só aceita URL curta (ex.: foto do Google). Data URL vai só no Firestore.
  if (input.photoURL && /^https?:\/\//i.test(input.photoURL)) {
    payload.photoURL = input.photoURL;
  }

  await updateProfile(user, payload);
}
