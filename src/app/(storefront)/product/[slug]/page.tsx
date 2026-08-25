import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import CheckoutForm from "@/components/storefront/CheckoutForm";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, seoTitle: true, seoDescription: true, shortDesc: true },
  });

  if (!product) return { title: "Produit introuvable" };

  return {
    title: product.seoTitle || `${product.name} — E-Com DZ`,
    description: product.seoDescription || product.shortDesc || "",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      category: true,
      reviews: { where: { isApproved: true } },
    },
  });

  if (!product || !product.isActive) notFound();

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Fil d'Ariane */}
      <nav className="mb-6 text-sm text-[var(--text-muted)]" aria-label="Fil d'Ariane">
        <Link href="/" className="hover:text-[var(--accent)]">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        {product.category && (
          <>
            <span className="text-[var(--text-secondary)]">{product.category.name}</span>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-[var(--text-secondary)]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Gauche : Images */}
        <div>
          <div className="aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-[var(--text-muted)]">
                📦
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]"
                >
                  <img src={img.url} alt={img.alt || ""} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Droite : Infos + Checkout */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <Badge variant="default" className="mb-2">
                {product.category.name}
              </Badge>
            )}
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{product.name}</h1>
            {avgRating > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span>{"⭐".repeat(Math.round(avgRating))}</span>
                <span>({product.reviews.length} avis)</span>
              </div>
            )}
          </div>

          <div className="text-3xl font-bold text-[var(--accent)]">
            {formatPrice(Number(product.basePrice))}
          </div>

          {product.shortDesc && <p className="text-[var(--text-secondary)]">{product.shortDesc}</p>}

          {product.description && (
            <div
              className="prose prose-sm max-w-none text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1">💵 Paiement à la livraison</span>
            <span className="flex items-center gap-1">🚚 Livraison 69 Wilayas</span>
          </div>

          {/* Formulaire de commande */}
          <CheckoutForm
            productId={product.id}
            productName={product.name}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: Number(v.price),
              isActive: v.isActive,
            }))}
            basePrice={Number(product.basePrice)}
          />
        </div>
      </div>

      {/* Section avis clients */}
      {product.reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
            Avis clients ({product.reviews.length})
          </h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">
                    {review.authorName}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {"⭐".repeat(review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
