import { NextRequest, NextResponse } from "next/server";
import { listCoverCandidates } from "@/lib/catalog-covers";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim();
  const title = request.nextUrl.searchParams.get("title")?.trim();
  if (!key || !title) {
    return NextResponse.json(
      { error: "key e title obrigatórios", covers: [] },
      { status: 400 },
    );
  }

  const authorsRaw = request.nextUrl.searchParams.get("authors")?.trim() ?? "";
  const authors = authorsRaw
    ? authorsRaw.split("|").map((a) => a.trim()).filter(Boolean)
    : [];
  const isbn = request.nextUrl.searchParams.get("isbn")?.trim() || undefined;
  const current =
    request.nextUrl.searchParams.get("current")?.trim() || undefined;

  try {
    const covers = await listCoverCandidates({
      key,
      title,
      authors,
      isbn,
      currentCoverUrl: current,
    });
    return NextResponse.json({ covers });
  } catch {
    return NextResponse.json(
      { error: "falha ao buscar capas", covers: [] },
      { status: 502 },
    );
  }
}
