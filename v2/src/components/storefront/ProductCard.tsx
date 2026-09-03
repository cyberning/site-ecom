"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types/storefront";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("storefront");
  const { addItem } = useCart();

  const primaryImage = product.images[0];
  const firstVariant = product.variants[0];
  const inStock = product.variants.some((v) => v.stock > 0);
  const price = firstVariant ? firstVariant.price : product.basePrice;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    addItem({
      variantId: firstVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantName: firstVariant.name,
      imageUrl: primaryImage?.url ?? "",
      unitPrice: firstVariant.price,
      quantity: 1,
      stock: firstVariant.stock,
    });
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] transition-shadow hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--bg-input)]">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
            {product.name}
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute start-2 top-2 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-white">
            {t("featured")}
          </span>
        )}
        {!inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
            {t("outOfStock")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-[var(--card-padding)]">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-heading text-base font-semibold text-[var(--text-primary)]">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-[var(--accent)]">
            {formatPrice(price)}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            aria-label={`${t("addToCart")} — ${product.name}`}
            className="inline-flex items-center gap-1.5 rounded-[var(--btn-radius)] bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("addToCart")}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
