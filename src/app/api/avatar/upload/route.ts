import { NextRequest, NextResponse } from "next/server";
import {
  configureCloudinary,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Envie uma imagem" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Imagem acima de 5MB" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;
    const folderUid =
      typeof uid === "string" && uid.trim() ? uid.trim() : "anon";

    const cloudinary = configureCloudinary();
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `leitour/avatars/${folderUid}`,
      public_id: "avatar",
      overwrite: true,
      invalidate: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    if (!result.secure_url) {
      return NextResponse.json(
        { error: "Upload sem URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha no upload";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
