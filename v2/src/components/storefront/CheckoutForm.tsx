"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Truck, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import type { Commune, DeliveryMode, DeliveryQuote, Wilaya } from "@/types/storefront";

interface CheckoutFormProps {
  wilayas: Wilaya[];
}

export function CheckoutForm({ wilayas }: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState("");
  const [communeCode, setCommuneCode] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("HOME");

  const [communes, setCommunes] = useState<Commune[]>([]);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load communes when wilaya changes
  useEffect(() => {
    if (!wilayaCode) {
      setCommunes([]);
      setCommuneCode("");
      setQuote(null);
      return;
    }
    let cancelled = false;
    setLoadingCommunes(true);
    setCommuneCode("");
    setQuote(null);
    fetch(`/api/communes?wilayaCode=${wilayaCode}`)
      .then((res) => res.json())
      .then((data: Commune[]) => {
        if (!cancelled) setCommunes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCommunes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wilayaCode]);

  // Calculate delivery fee when wilaya or mode changes
  useEffect(() => {
    if (!wilayaCode) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setLoadingQuote(true);
    fetch("/api/delivery/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wilayaCode: Number(wilayaCode), deliveryMode }),
    })
      .then((res) => res.json())
      .then((data: DeliveryQuote) => {
        if (!cancelled) setQuote(data);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingQuote(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wilayaCode, deliveryMode]);

  const deliveryFee = quote?.fee ?? 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError(t("emptyCart"));
      return;
    }

    const firstItem = items[0];
    if (items.length > 1) {
      setError(t("singleItemOnly"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          wilayaCode: Number(wilayaCode),
          communeCode,
          fullAddress,
          deliveryMode,
          variantId: firstItem.variantId,
          quantity: firstItem.quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("error"));
        return;
      }

      clearCart();
      router.push(`/checkout/success?trackingId=${data.trackingId}`);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]";

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
      {/* Form fields */}
      <div className="space-y-5 lg:col-span-3">
        <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
          {t("contactInfo")}
        </h2>

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            {t("name")} *
          </label>
          <input
            id="name"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            {t("phone")} *
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="05XXXXXXXX"
            className={inputClass}
            autoComplete="tel"
          />
        </div>

        <h2 className="pt-2 font-heading text-lg font-bold text-[var(--text-primary)]">
          {t("deliveryInfo")}
        </h2>

        <div>
          <label htmlFor="wilaya" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            {t("wilaya")} *
          </label>
          <select
            id="wilaya"
            required
            value={wilayaCode}
            onChange={(e) => setWilayaCode(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("selectWilaya")}</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="commune" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            {t("commune")} *
          </label>
          <select
            id="commune"
            required
            value={communeCode}
            onChange={(e) => setCommuneCode(e.target.value)}
            disabled={!wilayaCode || loadingCommunes}
            className={inputClass}
          >
            <option value="">
              {loadingCommunes ? t("loading") : t("selectCommune")}
            </option>
            {communes.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            {t("address")} *
          </label>
          <textarea
            id="address"
            required
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            rows={3}
            className={inputClass}
            autoComplete="street-address"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            {t("deliveryMode")} *
          </span>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDeliveryMode("HOME")}
              aria-pressed={deliveryMode === "HOME"}
              className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                deliveryMode === "HOME"
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-input)]"
              }`}
            >
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  {t("home")}
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {t("homeHint")}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMode("STOP_DESK")}
              aria-pressed={deliveryMode === "STOP_DESK"}
              className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                deliveryMode === "STOP_DESK"
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-input)]"
              }`}
            >
              <Package className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  {t("stopDesk")}
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {t("stopDeskHint")}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Order summary */}
      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <h2 className="mb-4 font-heading text-lg font-bold text-[var(--text-primary)]">
            {t("summary")}
          </h2>

          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              {t("emptyCart")}
            </p>
          ) : (
            <ul className="mb-4 space-y-3">
              {items.map((item) => (
                <li key={item.variantId} className="flex justify-between gap-2 text-sm">
                  <span className="text-[var(--text-secondary)]">
                    {item.productName}
                    <span className="block text-xs text-[var(--text-muted)]">
                      {item.variantName} × {item.quantity}
                    </span>
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">{t("subtotal")}</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">{t("deliveryFee")}</span>
              <span className="font-medium">
                {loadingQuote ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  formatPrice(deliveryFee)
                )}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base font-bold">
              <span className="text-[var(--text-primary)]">{t("total")}</span>
              <span className="text-[var(--accent)]">{formatPrice(total)}</span>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent-light)] px-3 py-2 text-xs text-[var(--accent)]">
            <span aria-hidden="true">💵</span>
            {t("codOnly")}
          </p>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-[var(--radius-sm)] bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[var(--btn-radius)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {t("placeOrder")}
          </button>
        </div>
      </div>
    </form>
  );
}
