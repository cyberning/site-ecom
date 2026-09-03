"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import {
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  getStatusLabel,
  type OrderStatus,
} from "@/lib/orderStatus";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const requestIdRef = useRef(0);

  const t = useTranslations("admin");
  const locale = useLocale();
  const statusLabel = (s: string) => getStatusLabel(s as OrderStatus, t);

  // Debounce de la recherche : le fetch ne se déclenche qu'après 300ms d'inactivité.
  // On remet aussi la page à 1 dans le même tick pour éviter de requêter
  // une page qui n'existe plus avec le nouveau terme (et le double fetch).
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error(t("ordersPage.loadError"));

      const data = await res.json();
      // Ignorer les réponses obsolètes (une requête plus récente est en cours)
      if (requestId !== requestIdRef.current) return;
      setOrders(data.orders || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setOrders([]);
      setError(t("ordersPage.loadError"));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    // Flush immédiat du debounce pour que la recherche soumise soit appliquée
    setDebouncedSearch(search);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("ordersPage.title")}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {t("ordersPage.total", { count: pagination.total })}
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
              placeholder={t("ordersPage.searchPlaceholder")}
              aria-label={t("ordersPage.searchAria")}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              {t("ordersPage.search")}
            </Button>
          </form>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label={t("ordersPage.filterStatusAria")}
            className="w-full sm:w-56"
            options={[
              { value: "ALL", label: t("ordersPage.allStatuses") },
              ...Object.entries(STATUS_LABELS).map(([key]) => ({
                value: key,
                label: statusLabel(key),
              })),
            ]}
          />
        </div>
      </Card>

      {/* Erreur de chargement */}
      {error && <Alert type="error" message={error} />}

      {/* Tableau des commandes */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)]">
            {t("ordersPage.noOrders")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    {t("ordersPage.tracking")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    {t("ordersPage.customer")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    {t("ordersPage.wilaya")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    {t("ordersPage.totalCol")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    {t("ordersPage.status")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    {t("ordersPage.date")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    {t("ordersPage.action")}
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
                      <Badge variant={STATUS_BADGE_VARIANT[order.status] || "default"}>
                        {statusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {formatDate(order.createdAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          {t("ordersPage.view")}
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
      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
    </div>
  );
}
