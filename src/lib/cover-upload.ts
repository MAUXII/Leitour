/** Sobe capa personalizada pro Cloudinary. */
export async function uploadCoverToCloudinary(
  file: File,
  uid: string,
  bookKey: string,
): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("uid", uid);
  body.append("bookKey", bookKey);

  const res = await fetch("/api/cover/upload", {
    method: "POST",
    body,
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Falha ao enviar a capa");
  }
  return data.url;
}
