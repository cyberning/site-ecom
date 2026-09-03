// Shared types for the admin (back-office) part of the app.
// These mirror the shapes returned by the admin API routes.

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  ordersByStatus: Record<string, number>;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

export interface RecentOrder {
  id: string;
  trackingId: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface TopProduct {
  variantId: string;
  variantName: string;
  productId: string | null;
  productName: string;
  productSlug: string | null;
  quantitySold: number;
}

export interface AdminOrder {
  id: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  wilayaCode: number;
  communeCode: string;
  fullAddress: string;
  deliveryMode: "HOME" | "STOP_DESK";
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
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
      // La route liste (GET /api/orders) inclut `product: true` sans images,
      // donc `images` est optionnel (présent uniquement sur le détail).
      images?: { id: string; url: string; alt: string }[];
    };
  };
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  category: AdminCategory | null;
  images: { id: string; url: string; alt: string; isPrimary: boolean }[];
  variants: AdminVariant[];
}

export interface AdminVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  productId: string;
  imageId: string | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
}
