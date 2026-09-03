"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import type { AdminCategory, AdminProduct, AdminVariant } from "@/types/admin";

interface ProductFormProps {
  categories: AdminCategory[];
  product?: AdminProduct;
}

interface VariantDraft {
  name: string;
  sku: string;
  price: string;
  stock: string;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(
    product ? String(product.basePrice) : ""
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    product?.seoDescription ?? ""
  );

  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [images, setImages] = useState<
    { id?: string; url: string; alt: string }[]
  >(
    product?.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt })) ??
      []
  );

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveProduct() {
    const payload = {
      name,
      slug: slug || undefined,
      description,
      basePrice: Number(basePrice),
      categoryId: categoryId || null,
      isActive,
      isFeatured,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    };

    const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? t("error"));
    }

    return (await res.json()) as { id: string };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const saved = await saveProduct();
      const productId = saved.id;

      // Add new variants
      for (const v of variants) {
        if (!v.name) continue;
        const vRes = await fetch(`/api/products/${productId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: v.name,
            sku: v.sku || undefined,
            price: Number(v.price),
            stock: Number(v.stock) || 0,
          }),
        });
        if (!vRes.ok) {
          const data = await vRes.json().catch(() => null);
          throw new Error(data?.error ?? t("error"));
        }
      }

      // Add new images (those not already persisted)
      const existingUrls = new Set(
        product?.images.map((img) => img.url) ?? []
      );
      for (const img of images) {
        if (existingUrls.has(img.url)) continue;
        const imgRes = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: img.url, alt: img.alt }),
        });
        if (!imgRes.ok) {
          const data = await imgRes.json().catch(() => null);
          throw new Error(data?.error ?? t("error"));
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read error"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, filename: file.name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? t("error"));
      }

      const data = (await res.json()) as { url: string };
      setImages((prev) => [...prev, { url: data.url, alt: name || "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeImage(img: { id?: string; url: string; alt: string }) {
    // Si l'image est déjà persistée en base (elle a un id), on la supprime
    // via l'API. Les images nouvellement uploadées (sans id) sont simplement
    // retirées de l'état local.
    if (img.id && isEdit) {
      try {
        const res = await fetch(
          `/api/products/${product!.id}/images?id=${img.id}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? t("error"));
          return;
        }
      } catch {
        setError(t("error"));
        return;
      }
    }
    setImages((prev) => prev.filter((i) => i.url !== img.url));
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {/* Basic info */}
      <section className="space-y-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
        <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
          {isEdit ? t("editProduct") : t("newProduct")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("name")} *
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="slug"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("slug")}
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={name.toLowerCase().replace(/\s+/g, "-")}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="basePrice"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("basePrice")} *
            </label>
            <input
              id="basePrice"
              type="number"
              min="0"
              step="any"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("category")}
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
          >
            {t("description")}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t("active")}
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t("featured")}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="seoTitle"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("seoTitle")}
            </label>
            <input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={60}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="seoDescription"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("seoDescription")}
            </label>
            <input
              id="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={160}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
        <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
          {t("images")}
        </h2>

        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div
              key={img.url}
              className="group relative h-24 w-24 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || ""}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(img)}
                aria-label={t("deleteImage")}
                className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {t("uploadImage")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </section>

      {/* Variants */}
      <section className="space-y-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
        <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
          {t("variants")}
        </h2>

        {/* Existing variants (edit mode) */}
        {isEdit && product!.variants.length > 0 && (
          <ul className="divide-y divide-[var(--border)]">
            {product!.variants.map((v: AdminVariant) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    {v.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{v.sku}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-[var(--text-secondary)]">
                  <span>{formatPriceLocal(v.price)}</span>
                  <span>{t("stock")}: {v.stock}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* New variant drafts */}
        {variants.map((v, idx) => (
          <div
            key={idx}
            className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] p-3 sm:grid-cols-5"
          >
            <input
              placeholder={t("variantName")}
              value={v.name}
              onChange={(e) =>
                setVariants((prev) =>
                  prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                )
              }
              className={inputClass}
            />
            <input
              placeholder={t("sku")}
              value={v.sku}
              onChange={(e) =>
                setVariants((prev) =>
                  prev.map((x, i) => (i === idx ? { ...x, sku: e.target.value } : x))
                )
              }
              className={inputClass}
            />
            <input
              placeholder={t("price")}
              type="number"
              min="0"
              step="any"
              value={v.price}
              onChange={(e) =>
                setVariants((prev) =>
                  prev.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x))
                )
              }
              className={inputClass}
            />
            <input
              placeholder={t("stock")}
              type="number"
              min="0"
              step="1"
              value={v.stock}
              onChange={(e) =>
                setVariants((prev) =>
                  prev.map((x, i) => (i === idx ? { ...x, stock: e.target.value } : x))
                )
              }
              className={inputClass}
            />
            <button
              type="button"
              onClick={() =>
                setVariants((prev) => prev.filter((_, i) => i !== idx))
              }
              aria-label={t("delete")}
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setVariants((prev) => [
              ...prev,
              { name: "", sku: "", price: "", stock: "" },
            ])
          }
          className="inline-flex items-center gap-2 rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addVariant")}
        </button>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[var(--btn-radius)] bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("saveProduct")}
        </button>
      </div>
    </form>
  );
}

function formatPriceLocal(amount: number): string {
  return (
    new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " DA"
  );
}
