import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product, ProductsResponse } from "@/types/storefront";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/products?featured=true&limit=8`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as ProductsResponse;
    return data.products;
  } catch {
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const products = await getFeaturedProducts();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--accent-light)] to-[var(--bg-primary)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="max-w-2xl font-heading text-3xl font-extrabold leading-tight text-[var(--text-primary)] sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xl text-base text-[var(--text-secondary)] sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="rounded-[var(--btn-radius)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              {t("shopNow")}
            </Link>
            <Link
              href="/track"
              className="rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-input)]"
            >
              {t("trackOrder")}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("featuredProducts")}
          </h2>
          <Link
            href="/products"
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">
            {t("noProducts")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
