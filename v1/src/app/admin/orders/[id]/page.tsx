"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Modal from "@/components/ui/Modal";
import { formatPrice } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { STATUS_OPTIONS, STATUS_BADGE_VARIANT } from "@/lib/orderStatus";

interface OrderDetail {
  id: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  fullAddress: string;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryMode: string;
  wilayaCode: string;
  communeCode: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variant: {
      name: string;
      product: { name: string; images: { url: string }[] };
    };
  }[];
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    changedBy?: { id: string; name: string | null; email: string } | null;
  }[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("admin");
  const locale = useLocale();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Les labelKey de STATUS_OPTIONS (ex: "status.pending") sont relative au namespace "admin"
  // de `t`. Le replace est conservé par tolérance si un jour une clé reprenait le préfixe.
  const statusLabel = (labelKey: string | undefined, fallback: string) =>
    labelKey ? t(labelKey.replace(/^admin\./, "")) : fallback;

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(t("orderDetail.notFound"));
        return r.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("orderDetail.notFound"));
        setLoading(false);
      });
  }, [id, t]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: note || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("orderDetail.updateError"));
      }

      // Mettre à jour le state localement
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          statusHistory: [
            {
              id: `temp-${Date.now()}`,
              fromStatus: prev.status,
              toStatus: newStatus,
              note: note || null,
              createdAt: new Date().toISOString(),
              changedBy: null,
            },
            ...prev.statusHistory,
          ],
        };
      });
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("orderDetail.unknownError"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center text-[var(--text-muted)]">
        {error || t("orderDetail.notFound")}
      </div>
    );
  }

  const currentStatusOption = STATUS_OPTIONS.find((s) => s.value === order.status);
  const currentStatusLabel = statusLabel(currentStatusOption?.labelKey, order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            {t("orderDetail.back")}
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {t("orderDetail.orderTitle", { trackingId: order.trackingId })}
          </h1>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[order.status] || "default"} className="text-sm">
          {currentStatusLabel}
        </Badge>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Infos client */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
            {t("orderDetail.customerLabel")}
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--text-muted)]">{t("orderDetail.name")} :</span>{" "}
              {order.customerName}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">{t("orderDetail.phone")} :</span>{" "}
              <a
                href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                className="text-[var(--accent)] transition-all duration-300 hover:underline"
              >
                {order.customerPhone}
              </a>
            </p>
            <p>
              <span className="text-[var(--text-muted)]">{t("orderDetail.wilayaLabel")} :</span>{" "}
              {order.wilayaCode}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">{t("orderDetail.commune")} :</span>{" "}
              {order.communeCode}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">{t("orderDetail.address")} :</span>{" "}
              {order.fullAddress}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">{t("orderDetail.deliveryLabel")} :</span>{" "}
              {order.deliveryMode === "HOME" ? t("orderDetail.home") : t("orderDetail.stopDesk")}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">{t("orderDetail.dateLabel")} :</span>{" "}
              {formatDate(order.createdAt, locale)}
            </p>
          </div>
        </Card>

        {/* Changement de statut */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
            {t("orderDetail.changeStatus")}
          </h3>
          <div className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("orderDetail.notePlaceholder")}
              aria-label={t("orderDetail.noteAria")}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.filter((s) => s.value !== order.status).map((opt) => (
                <Button
                  key={opt.value}
                  variant={opt.value === "CANCELLED" ? "danger" : "secondary"}
                  size="sm"
                  onClick={() => {
                    if (opt.value === "CANCELLED") {
                      setConfirmCancel(true);
                    } else {
                      updateStatus(opt.value);
                    }
                  }}
                  disabled={updating}
                >
                  {statusLabel(opt.labelKey, opt.value)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Résumé commande */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
            {t("orderDetail.summary")}
          </h3>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {item.variant.product.images[0] && (
                    <img
                      src={item.variant.product.images[0].url}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className="truncate text-[var(--text-secondary)]">
                    {item.variant.product.name} ({item.variant.name}) × {item.quantity}
                  </span>
                </div>
                <span className="flex-shrink-0 text-[var(--text-primary)]">
                  {formatPrice(Number(item.totalPrice))}
                </span>
              </div>
            ))}
            <div className="border-t border-[var(--border)] pt-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("orderDetail.subtotal")}</span>
                <span>{formatPrice(Number(order.total) - Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">
                  {t("orderDetail.deliveryLabel")}
                </span>
                <span>{formatPrice(Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t("orderDetail.total")}</span>
                <span className="text-[var(--accent)]">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Historique */}
      {order.statusHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
            {t("orderDetail.history")}
          </h3>
          <div className="space-y-3">
            {order.statusHistory.map((h) => {
              const label = statusLabel(
                STATUS_OPTIONS.find((s) => s.value === h.toStatus)?.labelKey,
                h.toStatus
              );
              return (
                <div
                  key={h.id}
                  className="flex items-start gap-3 border-b border-[var(--border)] pb-3 text-sm last:border-0 last:pb-0"
                >
                  <Badge variant={STATUS_BADGE_VARIANT[h.toStatus] || "default"}>{label}</Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDate(h.createdAt, locale)}
                      </span>
                      {h.changedBy && (
                        <span className="text-xs text-[var(--text-muted)]">
                          {t("orderDetail.by", { name: h.changedBy.name || h.changedBy.email })}
                        </span>
                      )}
                    </div>
                    {h.note && <p className="mt-1 text-[var(--text-secondary)]">{h.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Confirmation d'annulation (action destructive) */}
      <Modal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={t("orderDetail.cancelOrder")}
      >
        <p className="mb-6 text-[var(--text-secondary)]">
          {t("orderDetail.cancelConfirm")} {t("orderDetail.cancelIrreversible")}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
            {t("orderDetail.back2")}
          </Button>
          <Button
            variant="danger"
            disabled={updating}
            onClick={() => {
              setConfirmCancel(false);
              updateStatus("CANCELLED");
            }}
          >
            {updating ? t("orderDetail.cancelling") : t("orderDetail.confirmCancellation")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
