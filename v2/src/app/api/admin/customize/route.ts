import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/customize — Paramètres de thème (publique)
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { category: "theme" },
      orderBy: { key: "asc" },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erreur GET customize:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/admin/customize — Mettre à jour les paramètres de thème (admin)
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = Array.isArray(body) ? body : body.settings;

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json({ error: "Tableau de paramètres requis" }, { status: 400 });
    }

    const results = await prisma.$transaction(
      settings.map((s: { key: string; value: unknown }) => {
        if (!s.key || s.value === undefined) {
          throw new Error("Clé et valeur requises pour chaque paramètre");
        }
        return prisma.setting.upsert({
          where: { key: s.key },
          update: {
            value: JSON.stringify(s.value),
            category: "theme",
          },
          create: {
            key: s.key,
            value: JSON.stringify(s.value),
            category: "theme",
          },
        });
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof Error && error.message === "Clé et valeur requises pour chaque paramètre") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erreur PUT customize:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
