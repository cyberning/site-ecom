import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

/** Tous les statuts possibles, utilisés pour initialiser le compteur. */
const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "NEEDS_CONFIRMATION",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

/** Statuts considérés comme « revenu » (commande validée/expédiée/livrée). */
const REVENUE_STATUSES: OrderStatus[] = ["CONFIRMED", "SHIPPED", "DELIVERED"];

/** Statuts en attente de traitement. */
const PENDING_STATUSES: OrderStatus[] = ["PENDING", "NEEDS_CONFIRMATION"];

// GET /api/admin/stats — Statistiques du tableau de bord admin
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Date de début pour les 7 derniers jours (inclus aujourd'hui)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Lancer toutes les requêtes en parallèle pour la performance
    const [
      totalOrders,
      pendingOrders,
      revenueAgg,
      totalProducts,
      activeProducts,
      statusGroups,
      recentOrders,
      last7DaysOrders,
    ] = await Promise.all([
      // Nombre total de commandes
      prisma.order.count(),

      // Commandes en attente (PENDING ou NEEDS_CONFIRMATION)
      prisma.order.count({
        where: { status: { in: PENDING_STATUSES } },
      }),

      // Somme des totaux pour les commandes à revenu
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: REVENUE_STATUSES } },
      }),

      // Nombre total de produits
      prisma.product.count(),

      // Nombre de produits actifs
      prisma.product.count({ where: { isActive: true } }),

      // Répartition par statut (groupBy + count)
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // 5 dernières commandes avec leurs items (variant + produit)
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
                  price: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Commandes des 7 derniers jours (pour le graphique)
      prisma.order.groupBy({
        by: ["createdAt"],
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { id: true },
      }),
    ]);

    // Construire la map de répartition par statut avec 0 par défaut
    const ordersByStatus: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;
    for (const status of ALL_STATUSES) {
      ordersByStatus[status] = 0;
    }
    for (const group of statusGroups) {
      ordersByStatus[group.status] = group._count.id;
    }

    // Construire le tableau des 7 derniers jours avec 0 pour les jours sans commande
    const ordersLast7Days: { date: string; count: number }[] = [];
    const ordersByDayMap = new Map<string, number>();

    for (const entry of last7DaysOrders) {
      // Grouper par date (YYYY-MM-DD) en ignorant l'heure
      const dateKey = entry.createdAt.toISOString().split("T")[0];
      ordersByDayMap.set(dateKey, (ordersByDayMap.get(dateKey) ?? 0) + entry._count.id);
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      ordersLast7Days.push({
        date: dateKey,
        count: ordersByDayMap.get(dateKey) ?? 0,
      });
    }

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      totalRevenue: Number(revenueAgg._sum.total ?? 0),
      totalProducts,
      activeProducts,
      ordersByStatus,
      recentOrders,
      ordersLast7Days,
    });
  } catch (error) {
    console.error("Erreur GET admin stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
