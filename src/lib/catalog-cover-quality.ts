/** Qualidade de capas — evita placeholder Google e ISBN OL vazio. */

export function olIsbnCoverUrl(isbn: string, size: "M" | "L" = "L"): string {
  const clean = isbn.replace(/[-\s]/g, "");
  return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg`;
}

export function olCoverIdUrl(coverId: number, size: "M" | "L" = "L"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/**
 * Capa Google a partir do volume id.
 * zoom=1 (não 2/3): zoom alto cropar/pixelar ou estourar “Image not available”.
 */
export function googleCoverFromId(volumeId: string): string {
  const id = volumeId.replace(/^gb:/i, "").trim();
  return `https://books.google.com/books/content?id=${encodeURIComponent(id)}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
}

/** Lê dimensões JPEG/PNG do buffer (sem deps). */
export function imageDimensions(
  buf: Uint8Array,
): { w: number; h: number } | null {
  if (buf.length < 24) return null;

  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    const w =
      (buf[16]! << 24) | (buf[17]! << 16) | (buf[18]! << 8) | buf[19]!;
    const h =
      (buf[20]! << 24) | (buf[21]! << 16) | (buf[22]! << 8) | buf[23]!;
    if (w > 0 && h > 0) return { w, h };
    return null;
  }

  // JPEG
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1]!;
    if (marker === 0xd9 || marker === 0xda) break;
    const len = (buf[i + 2]! << 8) | buf[i + 3]!;
    // SOF0 / SOF2
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3
    ) {
      const h = (buf[i + 5]! << 8) | buf[i + 6]!;
      const w = (buf[i + 7]! << 8) | buf[i + 8]!;
      if (w > 0 && h > 0) return { w, h };
      return null;
    }
    i += 2 + len;
  }
  return null;
}

/**
 * True se a URL parece capa de verdade (não “Image not available” / 1×1 OL).
 */
export async function isUsableCoverUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/*",
        Range: "bytes=0-65535",
      },
      signal: AbortSignal.timeout(2800),
      next: { revalidate: 86400 },
    });
    if (!(res.ok || res.status === 206)) return false;

    const buf = new Uint8Array(await res.arrayBuffer());
    // OL sem capa → GIF/minúsculo (~43–200 bytes)
    if (buf.byteLength < 1200) return false;

    const dim = imageDimensions(buf);
    if (!dim) {
      // Não parseou, mas arquivo grosso o bastante
      return buf.byteLength >= 6000;
    }

    // Muito pequeno = ícone / placeholder
    if (dim.w < 120 || dim.h < 160) return false;

    // Placeholder clássico Google “Image not available” (~128×192 ou similar)
    if (dim.w <= 140 && dim.h <= 210) return false;

    // Quase quadrado minúsculo / banner estranho
    const ratio = dim.h / dim.w;
    if (ratio < 1.1 || ratio > 2.2) {
      // Capas de livro são ~2:3; deixa passar se for grande o bastante
      if (dim.w < 200 || dim.h < 280) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Capa pro volume Google — **Google do volume primeiro** (mesma obra na busca e no /book).
 * OL por ISBN depois: costuma apontar pra outra edição (página de título, scan ruim).
 * Sem capa boa → undefined.
 */
export async function resolveGoogleVolumeCover(input: {
  id: string;
  isbn?: string;
  fallbackThumb?: string;
}): Promise<string | undefined> {
  const fromId = googleCoverFromId(input.id);
  if (await isUsableCoverUrl(fromId)) return fromId;

  if (input.fallbackThumb) {
    const cleaned = input.fallbackThumb
      .replace(/^http:/i, "https:")
      .replace("&edge=curl", "")
      .replace(/zoom=\d+/i, "zoom=1");
    if (cleaned !== fromId && (await isUsableCoverUrl(cleaned))) {
      return cleaned;
    }
  }

  if (input.isbn) {
    const ol = olIsbnCoverUrl(input.isbn, "L");
    if (await isUsableCoverUrl(ol)) return ol;
  }

  return undefined;
}

/** Filtra lista de candidatas (picker) — descarta placeholder. */
export async function filterUsableCovers(
  urls: string[],
  max = 18,
): Promise<string[]> {
  const out: string[] = [];
  // Em paralelo, mas para cedo
  const chunk = urls.slice(0, Math.min(urls.length, 28));
  const flags = await Promise.all(chunk.map((u) => isUsableCoverUrl(u)));
  for (let i = 0; i < chunk.length; i++) {
    if (!flags[i]) continue;
    out.push(chunk[i]!);
    if (out.length >= max) break;
  }
  return out;
}
