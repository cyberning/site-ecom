import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validators";

// GET /api/orders/[id] — Détail d'une commande (admin/agent)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "CALL_AGENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: { include: { product: { include: { images: true } } } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Erreur GET order detail:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/orders/[id] — Mise à jour du statut (admin/agent)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "CALL_AGENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = orderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { status, note } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(note !== undefined && { notes: note }),
      },
    });

    // Créer un événement Analytics (fire-and-forget)
    try {
      await prisma.analytics.create({
        data: {
          eventType: "ORDER_STATUS_CHANGED",
          source: "AIRBYTE",
          payload: JSON.stringify({
            orderId: id,
            trackingId: order.trackingId,
            fromStatus: order.status,
            toStatus: status,
            changedBy: session.user.id,
          }),
        },
      });
    } catch (analyticsError) {
      console.error("Erreur création Analytics ORDER_STATUS_CHANGED:", analyticsError);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Erreur PUT order status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/orders/[id] — Supprimer une commande (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE order:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
