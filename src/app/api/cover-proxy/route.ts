import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set([
  "covers.openlibrary.org",
  "ia600809.us.archive.org",
  "archive.org",
]);

function isAllowedCover(url: URL) {
  if (ALLOWED.has(url.hostname)) return true;
  return url.hostname.endsWith(".archive.org");
}

/** Proxy same-origin pra amostrar tinta no canvas (CORS da OL costuma falhar). */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "url obrigatória" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "protocolo inválido" }, { status: 400 });
  }
  if (!isAllowedCover(target)) {
    return NextResponse.json({ error: "host não permitido" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*" },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 },
      );
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "falha ao buscar capa" }, { status: 502 });
  }
}
