import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type FeedPost = {
  id: string;
  authorUid: string;
  authorName: string;
  authorHandle: string;
  authorPhotoURL: string | null;
  bookKey: string | null;
  bookTitle: string;
  bookCoverUrl: string | null;
  bookAuthors: string[];
  body: string;
  rating: number | null;
  createdAt?: Timestamp;
};

export type CreatePostInput = {
  authorUid: string;
  authorName: string;
  authorHandle: string;
  authorPhotoURL: string | null;
  bookKey: string | null;
  bookTitle: string;
  bookCoverUrl: string | null;
  bookAuthors: string[];
  body: string;
  rating: number | null;
};

export async function createPost(input: CreatePostInput): Promise<string> {
  const body = input.body.trim();
  const bookTitle = input.bookTitle.trim();
  if (!body || !bookTitle) {
    throw new Error("Livro e texto são obrigatórios.");
  }
  if (body.length > 4000) {
    throw new Error("Texto muito longo.");
  }
  if (
    input.rating != null &&
    (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating))
  ) {
    throw new Error("Nota inválida.");
  }

  const ref = await addDoc(collection(getDb(), "posts"), {
    authorUid: input.authorUid,
    authorName: input.authorName,
    authorHandle: input.authorHandle,
    authorPhotoURL: input.authorPhotoURL,
    bookKey: input.bookKey,
    bookTitle,
    bookCoverUrl: input.bookCoverUrl,
    bookAuthors: input.bookAuthors,
    body,
    rating: input.rating,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listFeedPosts(max = 30): Promise<FeedPost[]> {
  const q = query(
    collection(getDb(), "posts"),
    orderBy("createdAt", "desc"),
    limit(Math.min(Math.max(max, 1), 50)),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      authorUid: String(data.authorUid ?? ""),
      authorName: String(data.authorName ?? "Leitor"),
      authorHandle: String(data.authorHandle ?? "@leitor"),
      authorPhotoURL: (data.authorPhotoURL as string | null) ?? null,
      bookKey: (data.bookKey as string | null) ?? null,
      bookTitle: String(data.bookTitle ?? ""),
      bookCoverUrl: (data.bookCoverUrl as string | null) ?? null,
      bookAuthors: Array.isArray(data.bookAuthors)
        ? (data.bookAuthors as string[])
        : [],
      body: String(data.body ?? ""),
      rating: typeof data.rating === "number" ? data.rating : null,
      createdAt: data.createdAt as Timestamp | undefined,
    };
  });
}

