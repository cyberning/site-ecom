"use client";

import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/providers/ThemeProvider";
import { cn, formatPrice } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  TrendingUp,
  Package,
  Check,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ThemeName = "NEUMORPHISM" | "LUXURY" | "VIBRANT" | "ORGANIC" | "TECH";

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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-500/15", text: "text-yellow-500" },
  NEEDS_CONFIRMATION: { bg: "bg-orange-500/15", text: "text-orange-500" },
  CONFIRMED: { bg: "bg-blue-500/15", text: "text-blue-500" },
  SHIPPED: { bg: "bg-purple-500/15", text: "text-purple-500" },
  DELIVERED: { bg: "bg-green-500/15", text: "text-green-500" },
  CANCELLED: { bg: "bg-red-500/15", text: "text-red-500" },
  RETURNED: { bg: "bg-gray-500/15", text: "text-gray-500" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  NEEDS_CONFIRMATION: "À confirmer",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  RETURNED: "Retournée",
};

const themes: {
  name: ThemeName;
  label: string;
  color: string;
  bg: string;
  description: string;
}[] = [
  {
    name: "NEUMORPHISM",
    label: "Neumorphism",
    color: "#4F46E5",
    bg: "#E0E5EC",
    description: "Interface douce et moderne",
  },
  {
    name: "LUXURY",
    label: "Luxury",
    color: "#D4AF37",
    bg: "#0B090A",
    description: "Élégance sombre et dorée",
  },
  {
    name: "VIBRANT",
    label: "Vibrant",
    color: "#CCFF00",
    bg: "#0F0F12",
    description: "Énergie streetwear néon",
  },
  {
    name: "ORGANIC",
    label: "Organic",
    color: "#6B8E23",
    bg: "#F7F5F0",
    description: "Naturel et artisanal",
  },
  {
    name: "TECH",
    label: "Tech",
    color: "#00E5FF",
    bg: "#0A0E17",
    description: "Futuriste high-tech",
  },
];

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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateChart(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateTable(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

/* ------------------------------------------------------------------ */
/*  Custom Recharts Tooltip                                            */
/* ------------------------------------------------------------------ */

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 shadow-lg"
      style={{ pointerEvents: "none" }}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {payload[0].value} commande{payload[0].value > 1 ? "s" : ""}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const { session } = useSession();
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Erreur lors du chargement des statistiques");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ---- Stat cards config ---- */
  const statCards = stats
    ? [
        {
          label: "Total Commandes",
          value: stats.totalOrders.toLocaleString("fr-FR"),
          icon: ShoppingCart,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
        {
          label: "En attente",
          value: stats.pendingOrders.toLocaleString("fr-FR"),
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
        },
        {
          label: "Chiffre d'affaires",
          value: formatPrice(stats.totalRevenue),
          icon: TrendingUp,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
        {
          label: "Produits actifs",
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
          <LayoutDashboard className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
            Bonjour, {session?.user?.name || "Admin"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">Voici un résumé de votre boutique</p>
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
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-neumorphic)] transition-[var(--transition)] hover:shadow-lg"
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

      {/* ---- Chart + Theme row ---- */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Chart — takes 2 cols */}
        <div className="xl:col-span-2">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-neumorphic)]">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Commandes — 7 derniers jours
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      stats?.ordersLast7Days.map((d) => ({
                        ...d,
                        date: formatDateChart(d.date),
                      })) ?? []
                    }
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--accent-light)", opacity: 0.3 }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--accent)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Theme picker — takes 1 col */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-neumorphic)]">
          <h3 className="mb-5 text-base font-semibold text-[var(--text-primary)]">
            Personnalisation du thème
          </h3>
          <div className="space-y-3">
            {themes.map((t) => {
              const isSelected = theme === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  className={cn(
                    "group/theme flex w-full items-center gap-4 rounded-[var(--radius-md)] border-2 p-3 text-left transition-[var(--transition)]",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-light)]"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-secondary)]"
                  )}
                >
                  {/* Color preview */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="h-10 w-14 rounded-[var(--radius-sm)]"
                      style={{ backgroundColor: t.bg }}
                    >
                      <div
                        className="mx-auto mt-3.5 h-1.5 w-6 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                    </div>
                    {/* Accent dot */}
                    <div
                      className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-[var(--bg-card)]"
                      style={{ backgroundColor: t.color }}
                    />
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{t.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t.description}</p>
                  </div>

                  {/* Check */}
                  {isSelected && (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- Recent Orders Table ---- */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-neumorphic)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Commandes récentes
              </h3>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-sm text-[var(--accent)] transition-[var(--transition)] hover:underline"
            >
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="px-6 py-3 font-medium whitespace-nowrap">Tracking ID</th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">Client</th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">Montant</th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">Statut</th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">Date</th>
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
                        className="border-b border-[var(--border)] transition-[var(--transition)] last:border-b-0 hover:bg-[var(--bg-secondary)]"
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
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-[var(--text-muted)]">
                          {formatDateTable(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
              Aucune commande récente
            </div>
          )}
        </div>
      )}
    </div>
  );
}
