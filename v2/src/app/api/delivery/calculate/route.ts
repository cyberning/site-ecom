import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const calculateSchema = z.object({
  wilayaCode: z.number().int().positive("Wilaya requise"),
  deliveryMode: z.enum(["HOME", "STOP_DESK"]),
});

// POST /api/delivery/calculate — Calcul des frais de livraison (publique)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = calculateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { wilayaCode, deliveryMode } = parsed.data;

    const matrix = await prisma.deliveryMatrix.findUnique({
      where: { wilayaCode },
    });

    if (!matrix) {
      // Pas de matrice = livraison gratuite par défaut
      return NextResponse.json({ fee: 0, estimatedDays: 2 });
    }

    return NextResponse.json({
      fee: Number(deliveryMode === "STOP_DESK" ? matrix.stopDeskFee : matrix.homeFee),
      estimatedDays: matrix.estimatedDays,
    });
  } catch (error) {
    console.error("Erreur calcul livraison:", error);
    return NextResponse.json({ fee: 0, estimatedDays: 2 });
  }
}
