import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type { CatalogBook } from "@/lib/catalog";
import { getDb } from "@/lib/firebase/client";

export type ShelfStatus = "quero_ler" | "lendo" | "lido" | "salvo";

export type ShelfItem = {
  bookKey: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  isbn?: string;
  year?: number;
  status: ShelfStatus;
  updatedAt?: Timestamp;
};

function shelfRef(uid: string, bookKey: string) {
  const safeKey = bookKey.replace(/\//g, "_");
  return doc(getDb(), "users", uid, "shelf", safeKey);
}

export async function upsertShelfItem(
  uid: string,
  book: CatalogBook,
  status: ShelfStatus,
): Promise<void> {
  await setDoc(
    shelfRef(uid, book.key),
    {
      bookKey: book.key,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl ?? null,
      isbn: book.isbn ?? null,
      year: book.year ?? null,
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function removeShelfItem(
  uid: string,
  bookKey: string,
): Promise<void> {
  await deleteDoc(shelfRef(uid, bookKey));
}

export function subscribeShelfItem(
  uid: string,
  bookKey: string,
  onItem: (item: ShelfItem | null) => void,
): Unsubscribe {
  return onSnapshot(shelfRef(uid, bookKey), (snap) => {
    onItem(snap.exists() ? (snap.data() as ShelfItem) : null);
  });
}

export async function listShelf(uid: string): Promise<ShelfItem[]> {
  const q = query(
    collection(getDb(), "users", uid, "shelf"),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ShelfItem);
}
