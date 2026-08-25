import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators";
import { generateTrackingId } from "@/lib/utils";
import crypto from "crypto";

function hashPhone(phone: string): string {
  return crypto.createHash("sha256").update(phone.replace(/\s/g, "")).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Vérifier que la variante existe et est active
    const variant = await prisma.variant.findUnique({
      where: { id: data.variantId },
      include: { product: true },
    });

    if (!variant || !variant.isActive) {
      return NextResponse.json({ error: "Variante non disponible" }, { status: 400 });
    }

    // Calcul des frais de livraison
    const matrix = await prisma.deliveryMatrix.findUnique({
      where: { wilayaCode: data.wilayaCode },
    });

    const deliveryFee = matrix
      ? Number(data.deliveryMode === "STOP_DESK" ? matrix.stopDeskFee : matrix.homeFee)
      : 0;

    const unitPrice = Number(variant.price);
    const subtotal = unitPrice * data.quantity;
    const total = subtotal + deliveryFee;

    // IP & User-Agent pour le suivi anti-fraude
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const order = await prisma.order.create({
      data: {
        trackingId: generateTrackingId(),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerPhoneHash: hashPhone(data.customerPhone),
        wilayaCode: data.wilayaCode,
        communeCode: data.communeCode,
        fullAddress: data.fullAddress,
        deliveryMode: data.deliveryMode,
        deliveryFee,
        subtotal,
        total,
        ip,
        userAgent,
        items: {
          create: {
            variantId: data.variantId,
            quantity: data.quantity,
            unitPrice,
            totalPrice: unitPrice * data.quantity,
          },
        },
      },
      include: { items: true },
    });

    return NextResponse.json(
      {
        trackingId: order.trackingId,
        orderId: order.id,
        total: order.total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création commande:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
