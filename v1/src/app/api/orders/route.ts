import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkoutSchema } from "@/lib/validators";
import { generateTrackingId } from "@/lib/utils";
import crypto from "crypto";

function hashPhone(phone: string): string {
  return crypto.createHash("sha256").update(phone.replace(/\s/g, "")).digest("hex");
}

// GET /api/orders — Liste paginée des commandes (admin/agent)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "CALL_AGENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.OrderWhereInput = {};
    if (status && status !== "ALL") {
      where.status = status as Prisma.EnumOrderStatusFilter["equals"];
    }
    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { variant: { include: { product: true } } } },
          statusHistory: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur GET orders:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/orders — Création de commande (storefront, publique)
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

    // --- Tracking pixels server-side (fire-and-forget) ---
    // On importe dynamiquement pour éviter les circular imports
    // et on catch pour ne jamais bloquer la réponse au client.
    import("@/lib/pixels")
      .then(({ fireAllActivePixels }) =>
        fireAllActivePixels({
          eventName: "Purchase",
          eventId: order.trackingId,
          timestamp: Math.floor(Date.now() / 1000),
          userData: {
            externalId: order.id,
            phone: data.customerPhone,
            ip,
            userAgent,
          },
          customData: {
            value: Number(order.total),
            currency: "DZD",
            contentType: "product",
            pageUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/thank-you?tracking=${order.trackingId}`,
          },
        })
      )
      .catch((err) => console.error("Pixel firing error:", err));

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
