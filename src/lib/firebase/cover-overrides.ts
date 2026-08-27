import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import {
  getUserProfile,
  normalizeFavorites,
  updateUserFavorites,
} from "@/lib/firebase/users";

export type CoverOverride = {
  bookKey: string;
  coverUrl: string;
  updatedBy: string;
};

function safeBookId(bookKey: string) {
  return bookKey.replace(/\//g, "_");
}

function localKey(uid: string, bookKey: string) {
  return `lt-cover:${uid}:${safeBookId(bookKey)}`;
}

function readLocal(uid: string, bookKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = window.localStorage.getItem(localKey(uid, bookKey));
    return url && url.startsWith("http") ? url : null;
  } catch {
    return null;
  }
}

function writeLocal(uid: string, bookKey: string, coverUrl: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localKey(uid, bookKey), coverUrl);
  } catch {
    /* quota */
  }
}

function userOverrideRef(uid: string, bookKey: string) {
  return doc(getDb(), "users", uid, "coverOverrides", safeBookId(bookKey));
}

function shelfRef(uid: string, bookKey: string) {
  return doc(getDb(), "users", uid, "shelf", safeBookId(bookKey));
}

/** Capa pessoal deste leitor pra esta obra (não é global do catálogo). */
export async function getPersonalCover(
  uid: string,
  bookKey: string,
): Promise<string | null> {
  const local = readLocal(uid, bookKey);
  if (local) return local;

  try {
    const mine = await getDoc(userOverrideRef(uid, bookKey));
    if (mine.exists()) {
      const url = mine.data()?.coverUrl;
      if (typeof url === "string" && url.startsWith("http")) return url;
    }
  } catch {
    /* rules */
  }
  return null;
}

export function subscribePersonalCover(
  uid: string,
  bookKey: string,
  onUrl: (coverUrl: string | null) => void,
): Unsubscribe {
  const local = readLocal(uid, bookKey);
  if (local) onUrl(local);

  return onSnapshot(
    userOverrideRef(uid, bookKey),
    (snap) => {
      if (snap.exists()) {
        const url = snap.data()?.coverUrl;
        if (typeof url === "string" && url.startsWith("http")) {
          onUrl(url);
          return;
        }
      }
      onUrl(readLocal(uid, bookKey));
    },
    () => onUrl(readLocal(uid, bookKey)),
  );
}

/**
 * Salva capa só pra este usuário: override + estante + favoritos.
 * Não altera a capa canônica do catálogo pra todo mundo.
 */
export async function setPersonalCover(
  uid: string,
  bookKey: string,
  coverUrl: string,
): Promise<void> {
  if (!/^https?:\/\//i.test(coverUrl)) {
    throw new Error("URL de capa inválida");
  }
  if (coverUrl.length > 2048) {
    throw new Error("URL de capa longa demais");
  }

  writeLocal(uid, bookKey, coverUrl);

  const payload = {
    bookKey,
    coverUrl,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };

  let persisted = false;

  try {
    await setDoc(userOverrideRef(uid, bookKey), payload, { merge: true });
    persisted = true;
  } catch {
    /* precisa rules aninhadas */
  }

  try {
    const shelf = await getDoc(shelfRef(uid, bookKey));
    if (shelf.exists()) {
      await setDoc(
        shelfRef(uid, bookKey),
        { coverUrl, updatedAt: serverTimestamp() },
        { merge: true },
      );
      persisted = true;
    }
  } catch {
    /* ignore */
  }

  try {
    const profile = await getUserProfile(uid);
    const favs = normalizeFavorites(profile?.favorites);
    if (favs.some((f) => f.bookKey === bookKey)) {
      await updateUserFavorites(
        uid,
        favs.map((f) =>
          f.bookKey === bookKey ? { ...f, coverUrl } : f,
        ),
      );
      persisted = true;
    }
  } catch {
    /* ignore */
  }

  if (!persisted && !readLocal(uid, bookKey)) {
    throw new Error("Não deu pra salvar a capa.");
  }
}

/** @deprecated use setPersonalCover */
export const setCoverOverride = setPersonalCover;
/** @deprecated use subscribePersonalCover */
export const subscribeCoverOverride = (
  bookKey: string,
  onUrl: (coverUrl: string | null) => void,
  uid?: string | null,
): Unsubscribe => {
  if (!uid) {
    onUrl(null);
    return () => undefined;
  }
  return subscribePersonalCover(uid, bookKey, onUrl);
};
