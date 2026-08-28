"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { name: string } | null;
  images: { url: string; alt: string | null }[];
  variants: ProductVariant[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Debounce de la recherche : le fetch ne se déclenche qu'après 300ms d'inactivité.
  // On remet aussi la page à 1 quand la recherche change, dans le même tick,
  // pour éviter le double fetch (ancienne page + page 1).
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (activeFilter) params.set("active", activeFilter);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();

      // Ignorer les réponses obsolètes (une requête plus récente est en cours)
      if (requestId !== requestIdRef.current) return;
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error("Erreur chargement produits:", error);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Erreur suppression:", error);
      setDeleteError("Impossible de supprimer ce produit. Veuillez réessayer.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Produits</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {pagination.total} produit{pagination.total > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>+ Nouveau produit</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un produit..."
            aria-label="Rechercher un produit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Tous les statuts" },
              { value: "true", label: "Actifs" },
              { value: "false", label: "Inactifs" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">
            {search ? "Aucun produit ne correspond à votre recherche" : "Aucun produit trouvé"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-sm text-[var(--text-secondary)]">
                  <th className="p-4">Image</th>
                  <th className="p-4">Nom</th>
                  <th className="p-4">Prix</th>
                  <th className="hidden p-4 md:table-cell">Catégorie</th>
                  <th className="hidden p-4 lg:table-cell">Variants</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]/50"
                  >
                    <td className="p-4">
                      <div className="h-12 w-12 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-secondary)]">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg text-[var(--text-muted)]">
                            📷
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{product.slug}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-[var(--accent)]">
                      {formatPrice(product.basePrice)}
                    </td>
                    <td className="hidden p-4 text-sm text-[var(--text-secondary)] md:table-cell">
                      {product.category?.name || "—"}
                    </td>
                    <td className="hidden p-4 lg:table-cell">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {product.variants.length} variante
                        {product.variants.length > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={product.isActive ? "success" : "danger"}>
                          {product.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        {product.isFeatured && <Badge variant="info">Vedette</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            Modifier
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          onClick={() => setDeleteId(product.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le produit">
        <p className="mb-6 text-[var(--text-secondary)]">
          Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
        </p>
        {deleteError && <Alert type="error" message={deleteError} className="mb-4" />}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
