import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  wilayaCode: z.string().min(2).max(2),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = querySchema.safeParse({
      wilayaCode: searchParams.get("wilayaCode"),
    });

    if (!result.success) {
      return NextResponse.json({ error: "Code wilaya invalide" }, { status: 400 });
    }

    const communes = await prisma.commune.findMany({
      where: { wilayaCode: result.data.wilayaCode, isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(communes);
  } catch (error) {
    console.error("Erreur récupération communes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
