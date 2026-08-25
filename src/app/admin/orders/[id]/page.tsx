"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

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

const STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente" },
  { value: "NEEDS_CONFIRMATION", label: "À confirmer" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "SHIPPED", label: "Expédiée" },
  { value: "DELIVERED", label: "Livrée" },
  { value: "CANCELLED", label: "Annulée" },
  { value: "RETURNED", label: "Retournée" },
];

const STATUS_BADGE_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> =
  {
    PENDING: "warning",
    NEEDS_CONFIRMATION: "info",
    CONFIRMED: "info",
    SHIPPED: "success",
    DELIVERED: "success",
    CANCELLED: "danger",
    RETURNED: "danger",
  };

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Commande non trouvée");
        return r.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Commande non trouvée");
        setLoading(false);
      });
  }, [id]);

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
        throw new Error(data.error || "Erreur lors de la mise à jour");
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
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat("fr-DZ").format(p) + " DA";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-DZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
        {error || "Commande non trouvée"}
      </div>
    );
  }

  const currentStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            &larr; Retour
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Commande {order.trackingId}
          </h1>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[order.status] || "default"} className="text-sm">
          {currentStatusLabel}
        </Badge>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Infos client */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">Client</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--text-muted)]">Nom :</span> {order.customerName}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Tél :</span> {order.customerPhone}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Wilaya :</span> {order.wilayaCode}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Commune :</span> {order.communeCode}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Adresse :</span> {order.fullAddress}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Livraison :</span>{" "}
              {order.deliveryMode === "HOME" ? "Domicile" : "Stop Desk"}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Date :</span> {formatDate(order.createdAt)}
            </p>
          </div>
        </Card>

        {/* Changement de statut */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">Changer le statut</h3>
          <div className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optionnel)..."
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.filter((s) => s.value !== order.status).map((opt) => (
                <Button
                  key={opt.value}
                  variant={opt.value === "CANCELLED" ? "danger" : "secondary"}
                  size="sm"
                  onClick={() => updateStatus(opt.value)}
                  disabled={updating}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Résumé commande */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">Résumé</h3>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-[var(--text-secondary)]">
                  {item.variant.product.name} ({item.variant.name}) × {item.quantity}
                </span>
                <span className="text-[var(--text-primary)]">
                  {formatPrice(Number(item.totalPrice))}
                </span>
              </div>
            ))}
            <div className="border-t border-[var(--border)] pt-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Sous-total</span>
                <span>{formatPrice(Number(order.total) - Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Livraison</span>
                <span>{formatPrice(Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[var(--accent)]">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Historique */}
      {order.statusHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">Historique</h3>
          <div className="space-y-3">
            {order.statusHistory.map((h) => {
              const label = STATUS_OPTIONS.find((s) => s.value === h.toStatus)?.label || h.toStatus;
              return (
                <div
                  key={h.id}
                  className="flex items-start gap-3 border-b border-[var(--border)] pb-3 text-sm last:border-0 last:pb-0"
                >
                  <Badge variant={STATUS_BADGE_VARIANT[h.toStatus] || "default"}>{label}</Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDate(h.createdAt)}
                      </span>
                      {h.changedBy && (
                        <span className="text-xs text-[var(--text-muted)]">
                          par {h.changedBy.name || h.changedBy.email}
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
    </div>
  );
}
