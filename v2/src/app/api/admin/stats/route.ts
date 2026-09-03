import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats — Statistiques du tableau de bord admin
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalRevenueAgg,
      pendingOrders,
      todayOrders,
      statusGroups,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Nombre total de commandes
      prisma.order.count(),

      // Somme des totaux de toutes les commandes
      prisma.order.aggregate({
        _sum: { total: true },
      }),

      // Commandes en attente
      prisma.order.count({
        where: { status: "PENDING" },
      }),

      // Commandes du jour
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),

      // Répartition par statut
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // 5 dernières commandes
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          trackingId: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),

      // Top produits par quantité vendue
      prisma.orderItem.groupBy({
        by: ["variantId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // Récupérer les détails des produits pour le top
    const topVariantIds = topProducts.map((t) => t.variantId);
    const topVariants = topVariantIds.length > 0
      ? await prisma.variant.findMany({
          where: { id: { in: topVariantIds } },
          include: { product: { select: { id: true, name: true, slug: true } } },
        })
      : [];

    const variantMap = new Map(topVariants.map((v) => [v.id, v]));

    const topProductsDetailed = topProducts.map((t) => {
      const variant = variantMap.get(t.variantId);
      return {
        variantId: t.variantId,
        variantName: variant?.name ?? "Inconnu",
        productId: variant?.product.id ?? null,
        productName: variant?.product.name ?? "Inconnu",
        productSlug: variant?.product.slug ?? null,
        quantitySold: t._sum.quantity ?? 0,
      };
    });

    // Construire la map de répartition par statut
    const ordersByStatus: Record<string, number> = {};
    for (const group of statusGroups) {
      ordersByStatus[group.status] = group._count.id;
    }

    return NextResponse.json({
      totalOrders,
      totalRevenue: Number(totalRevenueAgg._sum.total ?? 0),
      pendingOrders,
      todayOrders,
      ordersByStatus,
      recentOrders,
      topProducts: topProductsDetailed,
    });
  } catch (error) {
    console.error("Erreur GET admin stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
