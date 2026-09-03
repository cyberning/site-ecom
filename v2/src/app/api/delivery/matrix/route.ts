import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const matrixUpdateSchema = z.object({
  wilayaCode: z.number().int().positive("Wilaya requise"),
  homeFee: z.number().nonnegative().optional(),
  stopDeskFee: z.number().nonnegative().optional(),
  estimatedDays: z.number().int().positive().optional(),
});

// GET /api/delivery/matrix — Liste de la matrice de livraison (publique)
export async function GET() {
  try {
    const matrix = await prisma.deliveryMatrix.findMany({
      orderBy: { wilayaCode: "asc" },
    });

    return NextResponse.json(matrix);
  } catch (error) {
    console.error("Erreur GET delivery matrix:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/delivery/matrix — Mettre à jour une entrée de la matrice (admin)
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = matrixUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { wilayaCode, homeFee, stopDeskFee, estimatedDays } = parsed.data;

    // Récupérer le nom de la wilaya pour un éventuel upsert
    const wilaya = await prisma.wilaya.findUnique({
      where: { code: wilayaCode },
    });

    const entry = await prisma.deliveryMatrix.upsert({
      where: { wilayaCode },
      create: {
        wilayaCode,
        wilayaName: wilaya?.name ?? String(wilayaCode),
        homeFee: homeFee ?? 0,
        stopDeskFee: stopDeskFee ?? 0,
        estimatedDays: estimatedDays ?? 2,
      },
      update: {
        ...(homeFee !== undefined && { homeFee }),
        ...(stopDeskFee !== undefined && { stopDeskFee }),
        ...(estimatedDays !== undefined && { estimatedDays }),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Erreur PUT delivery matrix:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
