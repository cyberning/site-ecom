import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/delivery/matrix
 * Retourne la matrice de livraison pour les 69 wilayas,
 * enrichie avec les données de la table Wilaya.
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const [matrix, wilayas] = await Promise.all([
      prisma.deliveryMatrix.findMany({
        orderBy: { wilayaCode: "asc" },
      }),
      prisma.wilaya.findMany({
        orderBy: { code: "asc" },
      }),
    ]);

    // Indexer les wilayas par code pour un lookup rapide
    const wilayaMap = new Map(wilayas.map((w) => [w.code, w]));

    // Enrichir la matrice avec les données wilaya
    const enriched = matrix.map((row) => ({
      ...row,
      homeFee: Number(row.homeFee),
      stopDeskFee: Number(row.stopDeskFee),
      wilaya: wilayaMap.get(row.wilayaCode) ?? {
        code: row.wilayaCode,
        name: row.wilayaName,
        nameAr: "",
      },
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Erreur GET delivery matrix:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/delivery/matrix
 * Met à jour (ou crée) les tarifs de livraison pour un ou plusieurs wilayas.
 *
 * Body: { updates: Array<{ wilayaCode, homeFee?, stopDeskFee?, estimatedDays?, isActive? }> }
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Format invalide — tableau 'updates' requis" },
        { status: 400 }
      );
    }

    // Valider que chaque entrée a un wilayaCode
    for (const u of updates) {
      if (!u.wilayaCode || typeof u.wilayaCode !== "string") {
        return NextResponse.json(
          { error: "Chaque entrée doit contenir un wilayaCode valide" },
          { status: 400 }
        );
      }
    }

    // Récupérer les noms des wilayas pour les upserts créatifs
    const codes = updates.map((u: { wilayaCode: string }) => u.wilayaCode);
    const wilayas = await prisma.wilaya.findMany({
      where: { code: { in: codes } },
    });
    const wilayaMap = new Map(wilayas.map((w) => [w.code, w]));

    const results = await Promise.allSettled(
      updates.map(
        (u: {
          wilayaCode: string;
          homeFee?: number;
          stopDeskFee?: number;
          estimatedDays?: number;
          isActive?: boolean;
        }) => {
          const wilaya = wilayaMap.get(u.wilayaCode);

          return prisma.deliveryMatrix.upsert({
            where: { wilayaCode: u.wilayaCode },
            create: {
              wilayaCode: u.wilayaCode,
              wilayaName: wilaya?.name ?? u.wilayaCode,
              homeFee: u.homeFee ?? 0,
              stopDeskFee: u.stopDeskFee ?? 0,
              estimatedDays: u.estimatedDays ?? 2,
              isActive: u.isActive ?? true,
            },
            update: {
              ...(u.homeFee !== undefined && { homeFee: u.homeFee }),
              ...(u.stopDeskFee !== undefined && { stopDeskFee: u.stopDeskFee }),
              ...(u.estimatedDays !== undefined && {
                estimatedDays: u.estimatedDays,
              }),
              ...(u.isActive !== undefined && { isActive: u.isActive }),
            },
          });
        }
      )
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(
        "Delivery matrix update errors:",
        failed.map((r) => (r as PromiseRejectedResult).reason)
      );
    }

    return NextResponse.json({
      updated: results.length - failed.length,
      errors: failed.length,
    });
  } catch (error) {
    console.error("Erreur PUT delivery matrix:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
