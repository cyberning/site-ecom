"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/storefront";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const t = useTranslations("storefront");
  const { addItem } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];

  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;
  const price = selectedVariant?.price ?? product.basePrice;
  const images = product.images.length > 0 ? product.images : [];

  function handleAdd() {
    if (!selectedVariant) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantName: selectedVariant.name,
      imageUrl: images[0]?.url ?? "",
      unitPrice: selectedVariant.price,
      quantity,
      stock: selectedVariant.stock,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Images */}
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-[var(--card-radius)] bg-[var(--bg-input)]">
          {images.length > 0 ? (
            <Image
              src={images[activeImage].url}
              alt={images[activeImage].alt || product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
              {product.name}
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`${t("viewImage")} ${i + 1}`}
                aria-pressed={activeImage === i}
                className={`relative h-20 w-20 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  activeImage === i
                    ? "border-[var(--accent)]"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-4">
        {product.category && (
          <span className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {product.category.name}
          </span>
        )}
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          {product.name}
        </h1>

        <p className="text-3xl font-bold text-[var(--accent)]">
          {formatPrice(price)}
        </p>

        {/* Variants */}
        {product.variants.length > 1 && (
          <div>
            <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              {t("variant")}
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("variant")}>
              {product.variants.map((v) => {
                const active = v.id === selectedVariant?.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariantId(v.id);
                      setQuantity(1);
                    }}
                    disabled={v.stock <= 0}
                    aria-pressed={active}
                    className={`rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
                    }`}
                  >
                    {v.name}
                    {v.stock <= 0 && ` — ${t("outOfStock")}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {t("quantity")}
          </span>
          <div className="flex items-center gap-1 rounded-full border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label={t("decrease")}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-8 text-center text-base font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) =>
                  selectedVariant ? Math.min(q + 1, selectedVariant.stock) : q
                )
              }
              aria-label={t("increase")}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {selectedVariant && (
            <span className="text-sm text-[var(--text-muted)]">
              {selectedVariant.stock > 0
                ? t("inStock", { count: selectedVariant.stock })
                : t("outOfStock")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--btn-radius)] bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {inStock ? t("addToCart") : t("outOfStock")}
        </button>

        {/* Description */}
        {product.description && (
          <div className="mt-2 border-t border-[var(--border)] pt-4">
            <h2 className="mb-2 font-heading text-lg font-bold text-[var(--text-primary)]">
              {t("description")}
            </h2>
            <div
              className="prose-sm text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
