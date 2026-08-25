"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: { product: { name: string } };
}

interface Order {
  id: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  deliveryMode: string;
  wilayaCode: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  NEEDS_CONFIRMATION: "info",
  CONFIRMED: "info",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");

      const data = await res.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Commandes</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {pagination.total} commande(s) au total
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par tracking, nom, téléphone..."
              className="flex-1"
            />
            <Button type="submit" size="sm">
              Rechercher
            </Button>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Tableau des commandes */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)]">Aucune commande trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    Tracking
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    Wilaya
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--bg-secondary)]/50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--accent)]">
                      {order.trackingId}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{order.customerName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{order.wilayaCode}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[order.status] || "default"}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} / {pagination.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
