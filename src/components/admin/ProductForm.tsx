"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import ImageUploader from "@/components/admin/ImageUploader";
import type { ProductImage } from "@/components/admin/ImageUploader";

interface Variant {
  id?: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  productId: string | null;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isNew = !productId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Track which variants existed before editing (for delete detection)
  const [originalVariantIds, setOriginalVariantIds] = useState<Set<string>>(new Set());

  // Load product if editing
  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Produit non trouvé");
        return res.json();
      })
      .then((product) => {
        setName(product.name);
        setSlug(product.slug);
        setDescription(product.description || "");
        setShortDesc(product.shortDesc || "");
        setBasePrice(String(product.basePrice));
        setCategoryId(product.categoryId || "");
        setIsActive(product.isActive);
        setIsFeatured(product.isFeatured);
        setSeoTitle(product.seoTitle || "");
        setSeoDescription(product.seoDescription || "");

        // Load existing images
        if (Array.isArray(product.images)) {
          setImages(
            product.images.map(
              (img: {
                id: string;
                url: string;
                alt: string;
                isPrimary: boolean;
                sortOrder: number;
              }) => ({
                id: img.id,
                url: img.url,
                alt: img.alt || "",
                isPrimary: img.isPrimary,
                sortOrder: img.sortOrder,
              })
            )
          );
        }

        const loadedVariants: Variant[] = product.variants.map((v: Record<string, unknown>) => ({
          id: v.id as string,
          name: v.name as string,
          sku: (v.sku as string) || "",
          price: Number(v.price),
          isActive: v.isActive as boolean,
          sortOrder: v.sortOrder as number,
        }));
        setVariants(loadedVariants);
        setOriginalVariantIds(new Set(loadedVariants.map((v) => v.id).filter(Boolean) as string[]));
      })
      .catch(() => setError("Erreur lors du chargement du produit"))
      .finally(() => setLoading(false));
  }, [productId]);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Auto-generate slug (only for new products, when user hasn't manually edited it)
  const [slugEdited, setSlugEdited] = useState(false);
  useEffect(() => {
    if (!isNew || slugEdited) return;
    if (name) {
      setSlug(
        name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    } else {
      setSlug("");
    }
  }, [name, isNew, slugEdited]);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: "",
        sku: "",
        price: parseFloat(basePrice) || 0,
        isActive: true,
        sortOrder: variants.length,
      },
    ]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        name,
        slug: slug || undefined,
        description: description || undefined,
        shortDesc: shortDesc || undefined,
        basePrice: parseFloat(basePrice),
        categoryId: categoryId || null,
        isActive,
        isFeatured,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
      };

      const url = productId ? `/api/products/${productId}` : "/api/products";
      const method = productId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }

      const savedProduct = await res.json();
      const savedProductId = savedProduct.id;

      // Determine which variants were removed (existed before but not in current list)
      const currentVariantIds = new Set(variants.filter((v) => v.id).map((v) => v.id) as string[]);
      const removedVariantIds = [...originalVariantIds].filter((id) => !currentVariantIds.has(id));

      // Delete removed variants
      for (const variantId of removedVariantIds) {
        await fetch(`/api/variants/${variantId}`, { method: "DELETE" });
      }

      // Save variants (update existing, create new)
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const variantData = {
          productId: savedProductId,
          name: variant.name,
          sku: variant.sku || undefined,
          price: variant.price,
          isActive: variant.isActive,
          sortOrder: i,
        };

        if (variant.id) {
          // Update existing variant
          await fetch(`/api/variants/${variant.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variantData),
          });
        } else {
          // Create new variant
          await fetch("/api/variants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variantData),
          });
        }
      }

      // Save images (replace all for this product)
      await fetch(`/api/products/${savedProductId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((img, i) => ({
            ...(img.id ? { id: img.id } : {}),
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            sortOrder: i,
          })),
        }),
      });

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {isNew ? "Nouveau produit" : "Modifier le produit"}
        </h2>
        <Button variant="secondary" onClick={() => router.push("/admin/products")}>
          ← Retour
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-[var(--radius-sm)] border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Info */}
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Informations</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nom *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nom du produit"
            />
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              placeholder="auto-généré depuis le nom"
            />
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-[var(--transition)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="Description détaillée du produit"
              />
            </div>
            <Input
              label="Description courte (max 160)"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              maxLength={160}
              placeholder="Résumé pour les listings"
            />
            <Input
              label="Prix de base (DA) *"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              min="0"
              step="0.01"
              placeholder="0"
            />
            <Select
              label="Catégorie"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { value: "", label: "Aucune catégorie" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Actif</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              <span className="text-sm text-[var(--text-primary)]">En vedette</span>
            </label>
          </div>
        </section>

        {/* SEO */}
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">SEO</h3>
          <div className="space-y-4">
            <Input
              label="Titre SEO (max 60)"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={60}
              placeholder="Titre pour les moteurs de recherche"
            />
            <Input
              label="Description SEO (max 160)"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={160}
              placeholder="Description pour les moteurs de recherche"
            />
          </div>
        </section>

        {/* Images */}
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Images</h3>
          <ImageUploader images={images} onImagesChange={setImages} maxImages={10} />
        </section>

        {/* Variants */}
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Variants</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Tailles, couleurs, options… Le variant contient le stock et le prix final.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
              + Ajouter
            </Button>
          </div>

          {variants.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--text-muted)]">
              Aucun variant. Ajoutez des variantes pour gérer les tailles, couleurs, etc.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.id || `new-${index}`}
                  className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] p-4 sm:flex-row sm:items-end"
                >
                  <div className="flex-1">
                    <Input
                      label="Nom"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, "name", e.target.value)}
                      placeholder="ex: Taille M, Rouge"
                      required
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Input
                      label="SKU"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                      placeholder="SKU-001"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Input
                      label="Prix (DA)"
                      type="number"
                      value={String(variant.price)}
                      onChange={(e) =>
                        updateVariant(index, "price", parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-0.5">
                    <button
                      type="button"
                      onClick={() => updateVariant(index, "isActive", !variant.isActive)}
                      className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                        variant.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                      aria-label={variant.isActive ? "Désactiver ce variant" : "Activer ce variant"}
                    >
                      {variant.isActive ? "Actif" : "Inactif"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      aria-label="Supprimer ce variant"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/products")}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Sauvegarde..." : isNew ? "Créer le produit" : "Sauvegarder"}
          </Button>
        </div>
      </form>
    </div>
  );
}
