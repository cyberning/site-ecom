import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "5242880", 10); // 5 MB par défaut
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

// POST /api/upload — Upload d'image (admin)
// Body: { dataUrl: "data:image/png;base64,...", filename: "photo.png" }
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dataUrl, filename } = body as { dataUrl?: string; filename?: string };

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json({ error: "dataUrl requis" }, { status: 400 });
    }

    // Extraire le type MIME et les données base64
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Format data URL invalide" }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Type non autorisé. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)" }, { status: 400 });
    }

    // Déterminer l'extension
    let ext = "";
    if (filename && typeof filename === "string") {
      const fileExt = filename.split(".").pop()?.toLowerCase() || "";
      if (ALLOWED_EXTENSIONS.includes(fileExt)) {
        ext = fileExt;
      }
    }
    if (!ext) {
      ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    await writeFile(filePath, buffer);

    return NextResponse.json(
      {
        url: `/uploads/${uniqueName}`,
        name: filename || uniqueName,
        size: buffer.length,
        type: mimeType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
