/** Sobe avatar pro Cloudinary via API do Next → URL https curta (ok pro Auth). */
export async function uploadAvatarToCloudinary(
  file: File,
  uid: string,
): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("uid", uid);

  const res = await fetch("/api/avatar/upload", {
    method: "POST",
    body,
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Falha ao enviar a foto");
  }
  return data.url;
}
