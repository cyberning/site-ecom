import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orderStatus";

// Phone validation for Algeria: starts with 05, 06, or 07, 10 digits
export const phoneSchema = z
  .string()
  .regex(/^0(5|6|7)[0-9]{8}$/, "Le numéro doit commencer par 05, 06 ou 07 et contenir 10 chiffres");

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const changeEmailSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Le mot de passe actuel doit contenir au moins 6 caractères"),
  newPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  slug: z.string().min(1, "Le slug est obligatoire").optional(),
  description: z.string().optional(),
  shortDesc: z.string().max(160).optional(),
  basePrice: z.number().positive("Le prix doit être positif"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().nullable().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const variantSchema = z.object({
  productId: z.string().min(1, "Le produit est obligatoire"),
  name: z.string().min(1, "Le nom est obligatoire"),
  sku: z.string().optional(),
  price: z.number().positive("Le prix doit être positif"),
  isActive: z.boolean().default(true),
  imageId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  customerPhone: phoneSchema,
  wilayaCode: z.string().min(2, "Wilaya requise"),
  communeCode: z.string().min(2, "Commune requise"),
  fullAddress: z.string().min(5, "Adresse requise"),
  deliveryMode: z.enum(["HOME", "STOP_DESK"]),
  variantId: z.string().min(1, "Variante requise"),
  quantity: z.number().int().positive().default(1),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "CALL_AGENT"]),
});

export const settingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  category: z.string().default("general"),
  description: z.string().optional(),
});
