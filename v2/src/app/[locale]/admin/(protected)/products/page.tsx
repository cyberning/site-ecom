import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct } from "@/types/admin";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

async function getProducts(): Promise<AdminProduct[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/products?limit=100`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { products: AdminProduct[] };
    return data.products;
  } catch {
    return [];
  }
}

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          {t("products")}
        </h1>
        <Link
          href="/admin/products/new"
          className="rounded-[var(--btn-radius)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          {t("createProduct")}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">
          {t("noProducts")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">{t("name")}</th>
                <th className="px-4 py-3 font-medium">{t("category")}</th>
                <th className="px-4 py-3 font-medium">{t("basePrice")}</th>
                <th className="px-4 py-3 font-medium">{t("stock")}</th>
                <th className="px-4 py-3 font-medium">{t("status")}</th>
                <th className="px-4 py-3 font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((product) => {
                const totalStock = product.variants.reduce(
                  (sum, v) => sum + v.stock,
                  0
                );
                return (
                  <tr key={product.id} className="hover:bg-[var(--bg-input)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] object-cover"
                          />
                        )}
                        <span className="font-medium text-[var(--text-primary)]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      {formatPrice(product.basePrice)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      {totalStock}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.isActive
                            ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                            : "inline-flex rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700"
                        }
                      >
                        {product.isActive ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                        >
                          {t("edit")}
                        </Link>
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
