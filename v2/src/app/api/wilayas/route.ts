import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/wilayas — Liste des wilayas (publique)
export async function GET() {
  try {
    const wilayas = await prisma.wilaya.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json(wilayas);
  } catch (error) {
    console.error("Erreur récupération wilayas:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
