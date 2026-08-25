export const THEMES = ["NEUMORPHISM", "LUXURY", "VIBRANT", "ORGANIC", "TECH"] as const;
export type ThemeType = (typeof THEMES)[number];

export const LOCALES = ["fr", "ar", "en"] as const;
export type LocaleType = (typeof LOCALES)[number];

export const DEFAULT_THEME = "NEUMORPHISM";
export const DEFAULT_LOCALE = "fr";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const CURRENCY = "DZD";
export const CURRENCY_SYMBOL = "DA";

export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "5242880");

export const ADMIN_ROUTES = ["/admin"];
export const PUBLIC_ROUTES = ["/", "/product", "/thank-you"];
export const API_PUBLIC_ROUTES = ["/api/products", "/api/wilayas", "/api/communes", "/api/theme"];
