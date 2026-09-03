import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductDetail } from "@/components/storefront/ProductDetail";
import type { Product, ProductsResponse } from "@/types/storefront";

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    // 1. Fetch the list to find the product id by slug (list only returns
    //    the primary image per product).
    const listRes = await fetch(`${baseUrl}/api/products?limit=100`, {
      cache: "no-store",
    });
    if (!listRes.ok) return null;
    const listData = (await listRes.json()) as ProductsResponse;
    const match = listData.products.find((p) => p.slug === slug);
    if (!match) return null;

    // 2. Fetch the full detail by id (returns ALL images for the gallery).
    const detailRes = await fetch(`${baseUrl}/api/products/${match.id}`, {
      cache: "no-store",
    });
    if (!detailRes.ok) return null;
    return (await detailRes.json()) as Product;
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="breadcrumb" className="mb-6 text-sm text-[var(--text-muted)]">
        <a href={`/${locale}/products`} className="hover:text-[var(--accent)]">
          {t("title")}
        </a>
        <span aria-hidden="true"> / </span>
        <span className="text-[var(--text-secondary)]">{product.name}</span>
      </nav>
      <ProductDetail product={product} />
    </div>
  );
}
