import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import type { AdminOrder } from "@/types/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

async function getOrder(id: string): Promise<AdminOrder | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/orders/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as AdminOrder;
  } catch {
    return null;
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← {t("orders")}
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("orderDetail")}
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order info */}
        <section className="space-y-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)] lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
            {t("orderDetail")}
          </h2>

          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--text-muted)]">{t("trackingId")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {order.trackingId}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("customer")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {order.customerName}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("phone")}</dt>
              <dd className="font-medium text-[var(--text-primary)]" dir="ltr">
                {order.customerPhone}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("wilaya")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {order.wilayaCode}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("deliveryMode")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {order.deliveryMode === "HOME"
                  ? t("homeDelivery")
                  : t("stopDeskDelivery")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("date")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {new Date(order.createdAt).toLocaleString(locale)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--text-muted)]">{t("address")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {order.fullAddress}
              </dd>
            </div>
          </dl>

          {/* Items */}
          <div className="mt-4">
            <h3 className="mb-2 font-heading text-base font-semibold text-[var(--text-primary)]">
              {t("items")}
            </h3>
            <ul className="divide-y divide-[var(--border)]">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {item.variant.product.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.variant.product.images[0].url}
                        alt={item.variant.product.images[0].alt || item.variant.product.name}
                        className="h-12 w-12 shrink-0 rounded-[var(--radius-md)] object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {item.variant.product.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {item.variant.name} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                    {formatPrice(item.totalPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-1 border-t border-[var(--border)] pt-4 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>{t("deliveryFee")}</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold text-[var(--text-primary)]">
              <span>{t("grandTotal")}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Status update */}
        <section className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
            {t("updateStatus")}
          </h2>
          <OrderStatusForm order={order} />
        </section>
      </div>
    </div>
  );
}
