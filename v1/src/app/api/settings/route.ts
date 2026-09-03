import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateStoreSettingsCache } from "@/lib/getStoreSettings";

// GET /api/settings — Return all settings (admin only)
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const settings = await prisma.setting.findMany({
      // Exclure `delivery_providers` : cette clé contient les credentials transporteurs
      // (chiffrés au repos, mais jamais exposés via l'API settings générique).
      // Ils ne sont accessibles que via /api/delivery/providers (masqués).
      where: { key: { not: "delivery_providers" } },
      orderBy: { category: "asc" },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erreur GET settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/settings — Update multiple settings at once (admin only)
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { settings } = body as { settings?: { key: string; value: Prisma.InputJsonValue }[] };

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json({ error: "Tableau de paramètres requis" }, { status: 400 });
    }

    // Validate each entry has a key
    for (const s of settings) {
      if (!s.key || s.value === undefined) {
        return NextResponse.json(
          { error: `Clé requise pour chaque paramètre. Reçu: ${JSON.stringify(s)}` },
          { status: 400 }
        );
      }
    }

    // Upsert all settings in a transaction
    const results = await prisma.$transaction(
      settings.map((s) =>
        prisma.setting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value },
        })
      )
    );

    // Invalider le cache pour que les changements soient immédiatement visibles côté storefront
    invalidateStoreSettingsCache();

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erreur PUT settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
