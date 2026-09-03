import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Commande en attente de confirmation",
  CONFIRMED: "Commande confirmée et en préparation",
  SHIPPED: "Commande expédiée",
  DELIVERED: "Commande livrée",
  CANCELLED: "Commande annulée",
  RETURNED: "Commande retournée",
};

// GET /api/orders/track/[trackingId] — Suivi de commande (publique)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    const order = await prisma.order.findUnique({
      where: { trackingId },
      select: {
        trackingId: true,
        status: true,
        customerName: true,
        deliveryMode: true,
        subtotal: true,
        deliveryFee: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: {
                      where: { isPrimary: true },
                      take: 1,
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      trackingId: order.trackingId,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      customerName: order.customerName,
      deliveryMode: order.deliveryMode,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      createdAt: order.createdAt,
      items: order.items,
    });
  } catch (error) {
    console.error("Erreur GET track order:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
