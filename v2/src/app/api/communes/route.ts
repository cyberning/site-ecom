import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  wilayaCode: z.string().min(1, "Code wilaya requis"),
});

// GET /api/communes?wilayaCode=16 — Liste des communes d'une wilaya (publique)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = querySchema.safeParse({
      wilayaCode: searchParams.get("wilayaCode"),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const wilayaCode = parseInt(result.data.wilayaCode, 10);
    if (Number.isNaN(wilayaCode)) {
      return NextResponse.json({ error: "Code wilaya invalide" }, { status: 400 });
    }

    const communes = await prisma.commune.findMany({
      where: { wilayaCode },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(communes);
  } catch (error) {
    console.error("Erreur récupération communes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
