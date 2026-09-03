import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import type { AdminStats, OrderStatus } from "@/types/admin";
import { ORDER_STATUSES } from "@/types/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";

async function getStats(): Promise<AdminStats | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/admin/stats`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as AdminStats;
  } catch {
    return null;
  }
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)]">
        {t("error")}
      </div>
    );
  }

  const kpis = [
    { label: t("totalOrders"), value: stats.totalOrders },
    { label: t("totalRevenue"), value: formatPrice(stats.totalRevenue) },
    { label: t("pendingOrders"), value: stats.pendingOrders },
    { label: t("todayOrders"), value: stats.todayOrders },
  ];

  const maxStatus = Math.max(
    1,
    ...ORDER_STATUSES.map((s) => stats.ordersByStatus[s] ?? 0)
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
        {t("dashboard")}
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]"
          >
            <p className="text-sm text-[var(--text-muted)]">{kpi.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-[var(--text-primary)]">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by status (CSS bars) */}
        <section className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
            {t("ordersByStatus")}
          </h2>
          <div className="space-y-3">
            {ORDER_STATUSES.map((status: OrderStatus) => {
              const count = stats.ordersByStatus[status] ?? 0;
              const width = count === 0 ? 0 : Math.round((count / maxStatus) * 100);
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-[var(--text-secondary)]">
                    {t(status)}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-[var(--bg-input)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all"
                      style={{ width: `${width}%` }}
                      role="img"
                      aria-label={`${t(status)}: ${count}`}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-end text-sm font-semibold text-[var(--text-primary)]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top products */}
        <section className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
            {t("topProducts")}
          </h2>
          {stats.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              {t("noOrders")}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {stats.topProducts.map((p) => (
                <li
                  key={p.variantId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {p.productName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {p.variantName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                    {p.quantitySold}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
            {t("recentOrders")}
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            {t("noOrders")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-3 py-2 font-medium">{t("trackingId")}</th>
                  <th className="px-3 py-2 font-medium">{t("customer")}</th>
                  <th className="px-3 py-2 font-medium">{t("total")}</th>
                  <th className="px-3 py-2 font-medium">{t("status")}</th>
                  <th className="px-3 py-2 font-medium">{t("date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--bg-input)]">
                    <td className="px-3 py-3 font-medium text-[var(--accent)]">
                      {order.trackingId}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {order.customerName}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)]">
                      {new Date(order.createdAt).toLocaleDateString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
