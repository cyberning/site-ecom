"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Loader2, PackageSearch, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import type { TrackOrder as TrackOrderData } from "@/types/storefront";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

export function TrackOrder() {
  const t = useTranslations("track");
  const searchParams = useSearchParams();
  const initialTrackingId = searchParams.get("trackingId") ?? "";

  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [inputValue, setInputValue] = useState(initialTrackingId);
  const [order, setOrder] = useState<TrackOrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(id: string) {
    if (!id.trim()) {
      setError(t("enterTrackingId"));
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(id.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("notFound"));
        return;
      }
      setOrder(data);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  // Auto-search if a trackingId was passed in the URL
  useEffect(() => {
    if (initialTrackingId) {
      search(initialTrackingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrackingId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTrackingId(inputValue);
    search(inputValue);
  }

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === "CANCELLED" || order?.status === "RETURNED";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-heading text-3xl font-bold text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mb-8 text-[var(--text-secondary)]">{t("subtitle")}</p>

      <form onSubmit={handleSubmit} role="search" className="mb-8 flex gap-2">
        <label htmlFor="tracking-input" className="sr-only">
          {t("trackingId")}
        </label>
        <input
          id="tracking-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="DZ-XXXXXXXX-XXXX"
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[var(--btn-radius)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("search")}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-[var(--radius-sm)] bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {order && (
        <div className="space-y-6">
          {/* Status header */}
          <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">{t("trackingId")}</p>
                <p className="font-mono text-lg font-bold text-[var(--text-primary)]">
                  {order.trackingId}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isCancelled
                    ? "bg-red-100 text-red-600"
                    : "bg-[var(--accent-light)] text-[var(--accent)]"
                }`}
              >
                {order.statusLabel}
              </span>
            </div>

            {!isCancelled && (
              <ol className="flex items-center" aria-label={t("progress")}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  return (
                    <li
                      key={step}
                      className={`flex items-center ${i < STATUS_STEPS.length - 1 ? "flex-1" : ""}`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          done
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                        }`}
                      >
                        {i + 1}
                      </span>
                      {i < STATUS_STEPS.length - 1 && (
                        <span
                          className={`h-0.5 flex-1 ${
                            i < currentStep ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Items */}
          <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <h2 className="mb-4 font-heading text-lg font-bold text-[var(--text-primary)]">
              {t("items")}
            </h2>
            <ul className="space-y-4">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-input)]">
                    {item.variant.product.images[0]?.url ? (
                      <Image
                        src={item.variant.product.images[0].url}
                        alt={item.variant.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[var(--text-muted)]">
                        {item.variant.product.name}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.variant.product.slug}`}
                      className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
                    >
                      {item.variant.product.name}
                    </Link>
                    <span className="text-xs text-[var(--text-muted)]">
                      {item.variant.name} × {item.quantity}
                    </span>
                    <span className="mt-auto text-sm font-semibold">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("subtotal")}</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("deliveryFee")}</span>
                <span className="font-medium">{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base font-bold">
                <span className="text-[var(--text-primary)]">{t("total")}</span>
                <span className="text-[var(--accent)]">{formatPrice(order.total)}</span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Truck className="h-4 w-4" aria-hidden="true" />
              {order.deliveryMode === "HOME" ? t("homeDelivery") : t("stopDeskDelivery")}
            </p>
          </div>
        </div>
      )}

      {!order && !loading && !error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-[var(--text-muted)]">
          <PackageSearch className="h-12 w-12" aria-hidden="true" />
          <p>{t("hint")}</p>
        </div>
      )}
    </div>
  );
}
