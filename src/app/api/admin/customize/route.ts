import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateStoreSettingsCache } from "@/lib/getStoreSettings";
import { SETTING_KEYS } from "@/lib/customizationKeys";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAdmin(session: unknown): boolean {
  const s = session as { user?: { role?: string } } | null;
  return !!s?.user && s.user.role === "ADMIN";
}

// ---------------------------------------------------------------------------
// GET /api/admin/customize
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // Valeurs customisées BRUTES (sans fusion avec les défauts de thème).
    // Chaque client fusionne lui-même avec les défauts de SON thème local.
    const settings = await prisma.setting.findMany({
      where: { category: "customize" },
      orderBy: { key: "asc" },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erreur GET /api/admin/customize:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/customize
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body as {
      settings?: Array<{ key: string; value: string | number | boolean }>;
    };

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json({ error: "Tableau de paramètres requis" }, { status: 400 });
    }

    // Validate entries and only accept known keys
    for (const s of settings) {
      if (!s.key || s.value === undefined) {
        return NextResponse.json(
          { error: `Clé et valeur requises pour chaque paramètre. Reçu: ${JSON.stringify(s)}` },
          { status: 400 }
        );
      }
      if (!SETTING_KEYS[s.key]) {
        return NextResponse.json(
          { error: `Clé de personnalisation inconnue: ${s.key}` },
          { status: 400 }
        );
      }
    }

    // Upsert all settings in a single transaction
    const results = await prisma.$transaction(
      settings.map((s) => {
        const config = SETTING_KEYS[s.key];
        return prisma.setting.upsert({
          where: { key: s.key },
          update: {
            value: s.value as Prisma.InputJsonValue,
            type: config.type,
            category: "customize",
            description: config.description,
          },
          create: {
            key: s.key,
            value: s.value as Prisma.InputJsonValue,
            type: config.type,
            category: "customize",
            description: config.description,
          },
        });
      })
    );

    // Invalider le cache pour que les changements soient immédiatement visibles
    invalidateStoreSettingsCache();

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erreur PUT /api/admin/customize:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
