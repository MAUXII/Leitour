import { NextRequest, NextResponse } from "next/server";
import {
  configureCloudinary,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

/** Upload de capa personalizada (Cloudinary). */
export async function POST(request: NextRequest) {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary não configurado. Rode .\\scripts\\setup-cloudinary.ps1",
      },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const uid = form.get("uid");
    const bookKey = form.get("bookKey");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Envie uma imagem" }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Imagem acima de 8MB" },
        { status: 400 },
      );
    }

    const folderUid =
      typeof uid === "string" && uid.trim() ? uid.trim() : "anon";
    const safeBook =
      typeof bookKey === "string" && bookKey.trim()
        ? bookKey.trim().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)
        : `cover-${Date.now()}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;

    const cloudinary = configureCloudinary();
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `leitour/covers/${folderUid}`,
      public_id: safeBook,
      overwrite: true,
      invalidate: true,
      transformation: [
        { width: 800, height: 1200, crop: "fill", gravity: "auto" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    if (!result.secure_url) {
      return NextResponse.json({ error: "Upload sem URL" }, { status: 502 });
    }

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha no upload";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
