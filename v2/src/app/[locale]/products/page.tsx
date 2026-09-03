import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductFilters } from "@/components/storefront/ProductFilters";
import type { Category, Product, ProductsResponse } from "@/types/storefront";

interface SearchParams {
  category?: string;
  search?: string;
}

async function getProducts(
  category?: string,
  search?: string
): Promise<{ products: Product[]; categories: Category[] }> {
  try {
    const params = new URLSearchParams({ limit: "100" });
    if (category && category !== "all") params.set("category", category);
    if (search) params.set("search", search);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/products?${params.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { products: [], categories: [] };
    const data = (await res.json()) as ProductsResponse;

    // Derive unique categories from the returned products
    const categoryMap = new Map<string, Category>();
    for (const p of data.products) {
      if (p.category) categoryMap.set(p.category.id, p.category);
    }
    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    return { products: data.products, categories };
  } catch {
    return { products: [], categories: [] };
  }
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");

  const sp = await searchParams;
  const category = sp.category ?? "all";
  const search = sp.search ?? "";

  const { products, categories } = await getProducts(category, search);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-heading text-3xl font-bold text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mb-8 text-[var(--text-secondary)]">{t("subtitle")}</p>

      <Suspense
        fallback={
          <div className="mb-8 h-24 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-input)]" />
        }
      >
        <ProductFilters
          categories={categories}
          currentCategory={category}
          currentSearch={search}
        />
      </Suspense>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-[var(--text-primary)]">
            {t("noResults")}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t("noResultsHint")}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--text-muted)]" role="status">
            {t("count", { count: products.length })}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
