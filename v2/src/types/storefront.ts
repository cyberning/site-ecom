// Shared types for the storefront (public) part of the app.
// These mirror the shapes returned by the public API routes.

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  productId: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string | null;
  category: Category | null;
  images: ProductImage[];
  variants: Variant[];
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Wilaya {
  code: number;
  name: string;
  nameAr: string;
}

export interface Commune {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  wilayaCode: number;
}

export interface DeliveryQuote {
  fee: number;
  estimatedDays: number;
}

export type DeliveryMode = "HOME" | "STOP_DESK";

export interface TrackItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant: {
    id: string;
    name: string;
    sku: string;
    product: {
      id: string;
      name: string;
      slug: string;
      images: { url: string }[];
    };
  };
}

export interface TrackOrder {
  trackingId: string;
  status: string;
  statusLabel: string;
  customerName: string;
  deliveryMode: DeliveryMode;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: TrackItem[];
}

// ──────────────────────────────────────────────
// Cart
// ──────────────────────────────────────────────

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  stock: number;
}
