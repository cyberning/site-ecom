import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  imageUrl?: string;
  categoryName?: string;
  isActive: boolean;
}

export default function ProductCard({
  name,
  slug,
  basePrice,
  imageUrl,
  categoryName,
  isActive,
}: ProductCardProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat("fr-DZ").format(price) + " DA";

  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-neumorphic)] transition-[var(--transition)] hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-square bg-[var(--bg-secondary)]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-[var(--text-muted)]">
              📦
            </div>
          )}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="danger">Indisponible</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {categoryName && (
            <Badge variant="default" className="mb-2">
              {categoryName}
            </Badge>
          )}
          <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
            {name}
          </h3>
          <p className="mt-1 text-lg font-bold text-[var(--accent)]">{formatPrice(basePrice)}</p>
        </div>
      </div>
    </Link>
  );
}
