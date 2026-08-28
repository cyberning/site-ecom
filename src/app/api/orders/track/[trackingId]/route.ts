import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Commande en attente de confirmation",
  NEEDS_CONFIRMATION: "Commande en attente de confirmation téléphonique",
  CONFIRMED: "Commande confirmée et en préparation",
  SHIPPED: "Commande expédiée",
  DELIVERED: "Commande livrée",
  CANCELLED: "Commande annulée",
  RETURNED: "Commande retournée",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  const order = await prisma.order.findUnique({
    where: { trackingId },
    select: {
      trackingId: true,
      status: true,
      createdAt: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        select: { toStatus: true, note: true, createdAt: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
  }

  return NextResponse.json({
    trackingId: order.trackingId,
    currentStatus: order.status,
    currentStatusLabel: STATUS_LABELS[order.status] || order.status,
    timeline: order.statusHistory.map((h) => ({
      status: h.toStatus,
      label: STATUS_LABELS[h.toStatus] || h.toStatus,
      note: h.note,
      date: h.createdAt,
    })),
  });
}
