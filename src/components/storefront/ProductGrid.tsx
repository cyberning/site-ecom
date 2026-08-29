"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import Spinner from "@/components/ui/Spinner";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isActive: boolean;
  images: { url: string; isPrimary: boolean }[];
  category: { name: string } | null;
  variants: { isActive: boolean }[];
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=20&active=true")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur de chargement");
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-[var(--text-muted)]">
          Une erreur est survenue lors du chargement des produits
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-[var(--text-muted)]">Aucun produit disponible pour le moment</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Revenez bientôt !</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[calc(var(--spacing-unit)*6)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
        return (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            basePrice={Number(product.basePrice)}
            imageUrl={primaryImage?.url}
            categoryName={product.category?.name}
            isActive={product.isActive && product.variants.some((v) => v.isActive)}
          />
        );
      })}
    </div>
  );
}
