const PLACEHOLDER_TINTS = [
  "rgb(52, 24, 20)",
  "rgb(16, 34, 46)",
  "rgb(16, 40, 30)",
  "rgb(36, 20, 48)",
  "rgb(42, 32, 12)",
  "rgb(22, 22, 42)",
] as const;

/** Fallback neutro quando há capa (evita roxo/placeholder colorido embaixo). */
export const NEUTRAL_COVER_TINT = "rgb(14, 16, 20)";

const memoryTint = new Map<string, string>();
const STORAGE_KEY = "lt-cover-tint-v2";

export function coverIndex(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 6;
  }
  return hash;
}

export function placeholderTint(seed: string): string {
  return PLACEHOLDER_TINTS[coverIndex(seed)];
}

function parseRgb(rgb: string): [number, number, number] | null {
  const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function mixWhite(rgb: string, amount: number) {
  const parsed = parseRgb(rgb);
  if (!parsed) return "rgba(255, 255, 255, 0.22)";
  const [r, g, b] = parsed;
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
}

export function scrollThumbFromTint(rgb: string) {
  return mixWhite(rgb, 0.42);
}

export function scrollThumbHoverFromTint(rgb: string) {
  return mixWhite(rgb, 0.58);
}

export function peekCoverTint(url: string): string | null {
  const mem = memoryTint.get(url);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    const hit = map[url];
    if (!hit) return null;
    memoryTint.set(url, hit);
    return hit;
  } catch {
    return null;
  }
}

function writeCoverTint(url: string, tint: string) {
  memoryTint.set(url, tint);
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, string>;
    map[url] = tint;
    const keys = Object.keys(map);
    if (keys.length > 48) {
      for (const key of keys.slice(0, keys.length - 48)) delete map[key];
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

/** URL same-origin pra amostrar no canvas sem CORS. */
export function coverSampleUrl(url: string): string {
  if (url.startsWith("/")) return url;
  return `/api/cover-proxy?url=${encodeURIComponent(url)}`;
}

export function sampleCoverTint(url: string): Promise<string | null> {
  const cached = peekCoverTint(url);
  if (cached) return Promise.resolve(cached);

  const sampleSrc = coverSampleUrl(url);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i]!;
          const pg = data[i + 1]!;
          const pb = data[i + 2]!;
          const pa = data[i + 3]!;
          if (pa < 200) continue;
          const lum = (pr + pg + pb) / 3;
          if (lum < 18 || lum > 240) continue;
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const sat = max === 0 ? 0 : (max - min) / max;
          const w = 0.35 + sat;
          r += pr * w;
          g += pg * w;
          b += pb * w;
          weight += w;
        }
        if (weight < 1) {
          resolve(null);
          return;
        }
        const keep = 0.26;
        const tint = `rgb(${Math.round((r / weight) * keep)}, ${Math.round((g / weight) * keep)}, ${Math.round((b / weight) * keep)})`;
        writeCoverTint(url, tint);
        resolve(tint);
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = sampleSrc;
  });
}
