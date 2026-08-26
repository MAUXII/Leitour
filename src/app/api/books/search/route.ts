import { NextRequest, NextResponse } from "next/server";
import { prepareCatalogQuery, searchCatalogBooks } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const prepared = prepareCatalogQuery(q);
  if (!prepared.ok) {
    return NextResponse.json({ books: [], reason: prepared.reason });
  }

  try {
    const books = await searchCatalogBooks(q);
    return NextResponse.json({ books });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao buscar livros";
    return NextResponse.json({ error: message, books: [] }, { status: 502 });
  }
}
