import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AdminCategory, AdminProduct } from "@/types/admin";
import { ProductForm } from "@/components/admin/ProductForm";

async function getProduct(id: string): Promise<AdminProduct | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/products/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as AdminProduct;
  } catch {
    return null;
  }
}

async function getCategories(): Promise<AdminCategory[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/products?limit=100`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { products: AdminProduct[] };
    const map = new Map<string, AdminCategory>();
    for (const p of data.products) {
      if (p.category) map.set(p.category.id, p.category);
    }
    return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← {t("products")}
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-[var(--text-primary)]">
          {t("editProduct")}
        </h1>
      </div>

      <ProductForm categories={categories} product={product} />
    </div>
  );
}
