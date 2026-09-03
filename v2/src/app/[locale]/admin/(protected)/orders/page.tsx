import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import type { AdminOrder } from "@/types/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderFilters } from "@/components/admin/OrderFilters";

interface SearchParams {
  status?: string;
  search?: string;
}

async function getOrders(
  status?: string,
  search?: string
): Promise<AdminOrder[]> {
  try {
    const params = new URLSearchParams({ limit: "100" });
    if (status && status !== "ALL") params.set("status", status);
    if (search) params.set("search", search);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/orders?${params.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { orders: AdminOrder[] };
    return data.orders;
  } catch {
    return [];
  }
}

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const sp = await searchParams;
  const status = sp.status ?? "ALL";
  const search = sp.search ?? "";

  const orders = await getOrders(status, search);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          {t("orders")}
        </h1>
      </div>

      <OrderFilters currentStatus={status} currentSearch={search} />

      {orders.length === 0 ? (
        <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">
          {t("noOrders")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">{t("trackingId")}</th>
                <th className="px-4 py-3 font-medium">{t("customer")}</th>
                <th className="px-4 py-3 font-medium">{t("total")}</th>
                <th className="px-4 py-3 font-medium">{t("status")}</th>
                <th className="px-4 py-3 font-medium">{t("date")}</th>
                <th className="px-4 py-3 font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--bg-input)]">
                  <td className="px-4 py-3 font-medium text-[var(--accent)]">
                    {order.trackingId}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {new Date(order.createdAt).toLocaleDateString(locale)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                    >
                      {t("view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
