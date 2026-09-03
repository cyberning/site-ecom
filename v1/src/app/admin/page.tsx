"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "@/hooks/useSession";
import { cn, formatPrice } from "@/lib/utils";
import { STATUS_COLORS, getStatusLabel, type OrderStatus } from "@/lib/orderStatus";
import { formatDate } from "@/lib/format";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  TrendingUp,
  Package,
  ChevronRight,
} from "lucide-react";

// recharts est un bundle lourd (~140 KB gzip) : chargé dynamiquement, uniquement côté client
const OrdersChart = dynamic(() => import("@/components/admin/OrdersChart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-secondary)]" />
  ),
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StatsData {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  activeProducts: number;
  ordersByStatus: Record<string, number>;
  recentOrders: {
    id: string;
    trackingId: string;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  ordersLast7Days: { date: string; count: number }[];
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function StatCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-secondary)]" />
        <div className="h-8 w-20 animate-pulse rounded bg-[var(--bg-secondary)]" />
      </div>
      <div className="mt-3 h-4 w-28 animate-pulse rounded bg-[var(--bg-secondary)]" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="mb-4 h-5 w-48 animate-pulse rounded bg-[var(--bg-secondary)]" />
      <div className="h-64 w-full animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-secondary)]" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="mb-4 h-5 w-48 animate-pulse rounded bg-[var(--bg-secondary)]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[var(--border)] py-3 last:border-b-0"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--bg-secondary)]" />
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-secondary)]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[var(--bg-secondary)]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[var(--bg-secondary)]" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const { session } = useSession();
  const t = useTranslations("admin");
  const locale = useLocale();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error(t("dashboardPage.loadError"));
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboardPage.unknownError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ---- Stat cards config ---- */
  const statCards = stats
    ? [
        {
          label: t("dashboardPage.totalOrders"),
          value: stats.totalOrders.toLocaleString(locale),
          icon: ShoppingCart,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
        {
          label: t("dashboardPage.pending"),
          value: stats.pendingOrders.toLocaleString(locale),
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
        },
        {
          label: t("dashboardPage.revenue"),
          value: formatPrice(stats.totalRevenue),
          icon: TrendingUp,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
        {
          label: t("dashboardPage.activeProducts"),
          value: `${stats.activeProducts} / ${stats.totalProducts}`,
          icon: Package,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* ---- Greeting ---- */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-light)]">
          <LayoutDashboard className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
            {t("dashboardPage.greeting", {
              name: session?.user?.name || t("dashboardPage.greetingFallback"),
            })}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">{t("dashboardPage.summary")}</p>
        </div>
      </div>

      {/* ---- Error banner ---- */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* ---- Stats Grid ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="group animate-fade-in-up rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-neumorphic)] transition-all duration-300 hover:shadow-lg"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-300 group-hover:scale-110",
                        card.bgColor
                      )}
                    >
                      <Icon className={cn("h-5 w-5", card.color)} />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {card.value}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{card.label}</p>
                </div>
              );
            })}
      </div>

      {/* ---- Chart ---- */}
      <div>{loading ? <ChartSkeleton /> : <OrdersChart data={stats?.ordersLast7Days ?? []} />}</div>

      {/* ---- Recent Orders Table ---- */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div
          className="animate-fade-in-up rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-neumorphic)]"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {t("dashboardPage.recentOrders")}
              </h3>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-sm text-[var(--accent)] transition-all duration-300 hover:underline"
            >
              {t("dashboardPage.viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      {t("dashboardPage.trackingId")}
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      {t("dashboardPage.customer")}
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      {t("dashboardPage.amount")}
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      {t("dashboardPage.status")}
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      {t("dashboardPage.date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.slice(0, 5).map((order) => {
                    const sc = STATUS_COLORS[order.status] ?? {
                      bg: "bg-gray-500/15",
                      text: "text-gray-500",
                    };
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[var(--border)] transition-all duration-300 last:border-b-0 hover:bg-[var(--bg-secondary)]"
                      >
                        <td className="px-6 py-3.5 font-mono text-xs font-medium whitespace-nowrap text-[var(--text-primary)]">
                          {order.trackingId}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {order.customerPhone}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-semibold whitespace-nowrap text-[var(--text-primary)]">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              sc.bg,
                              sc.text
                            )}
                          >
                            {getStatusLabel(order.status as OrderStatus, t)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-[var(--text-muted)]">
                          {formatDate(order.createdAt, locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
              {t("dashboardPage.noRecentOrders")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
