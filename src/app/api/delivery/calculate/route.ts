import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { wilayaCode, deliveryMode } = await request.json();

    if (!wilayaCode) {
      return NextResponse.json({ error: "Code wilaya requis" }, { status: 400 });
    }

    const matrix = await prisma.deliveryMatrix.findUnique({
      where: { wilayaCode },
    });

    if (!matrix || !matrix.isActive) {
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
