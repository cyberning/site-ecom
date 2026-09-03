"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const t = useTranslations("cart");
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } =
    useCart();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-[var(--bg-secondary)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-[var(--text-primary)]">
            <ShoppingCart className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            {t("title")}
            <span className="text-sm font-medium text-[var(--text-muted)]">
              ({items.length})
            </span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("close")}
            className="rounded-full p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-input)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingCart
              className="h-12 w-12 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <p className="text-[var(--text-secondary)]">{t("empty")}</p>
            <Link
              href="/products"
              onClick={closeCart}
              className="rounded-[var(--btn-radius)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              {t("browse")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[var(--border)] overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-input)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[var(--text-muted)]">
                        {item.productName}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
                    >
                      {item.productName}
                    </Link>
                    <span className="text-xs text-[var(--text-muted)]">
                      {item.variantName}
                    </span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          aria-label={t("decrease")}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          aria-label={t("increase")}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    aria-label={`${t("remove")} ${item.productName}`}
                    className="self-start rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-input)] hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-[var(--border)] px-5 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">{t("subtotal")}</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full rounded-[var(--btn-radius)] bg-[var(--accent)] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                {t("checkout")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
