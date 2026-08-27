import { NextRequest, NextResponse } from "next/server";
import { prepareCatalogQuery, searchCatalogBooks } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const pageRaw = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "16");
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 24)
    : 16;

  const prepared = prepareCatalogQuery(q);
  if (!prepared.ok) {
    return NextResponse.json({
      books: [],
      hasMore: false,
      reason: prepared.reason,
    });
  }

  try {
    const { books, hasMore } = await searchCatalogBooks(q, limit, page);
    return NextResponse.json(
      { books, hasMore, page },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao buscar livros";
    return NextResponse.json(
      { error: message, books: [], hasMore: false },
      { status: 502 },
    );
  }
}
