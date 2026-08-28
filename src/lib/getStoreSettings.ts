import { prisma } from "./prisma";

interface StoreSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  footerText: string;
  heroImage: string;
  heroTitle: string;
}

const defaults: StoreSettings = {
  storeName: "E-Com DZ",
  tagline: "Votre destination pour les meilleurs produits. Paiement à la livraison.",
  contactEmail: "contact@ecom-dz.com",
  contactPhone: "+213 XX XX XX XX",
  contactAddress: "Alger, Algérie",
  footerText: "Votre destination pour les meilleurs produits. Paiement à la livraison.",
  heroImage: "",
  heroTitle: "Les meilleurs produits au meilleur prix",
};

let cache: StoreSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateStoreSettingsCache(): void {
  cache = null;
  cacheTime = 0;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) {
    return cache;
  }

  try {
    const rows = await prisma.setting.findMany({
      where: { category: "customize" },
    });

    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }

    const result: StoreSettings = {
      storeName: map.custom_store_name || defaults.storeName,
      tagline: map.custom_store_tagline || defaults.tagline,
      contactEmail: map.custom_contact_email || defaults.contactEmail,
      contactPhone: map.custom_contact_phone || defaults.contactPhone,
      contactAddress: map.custom_contact_address || defaults.contactAddress,
      footerText: map.custom_footer_text || defaults.footerText,
      heroImage: map.custom_hero_image || defaults.heroImage,
      heroTitle: map.custom_hero_title || defaults.heroTitle,
    };

    cache = result;
    cacheTime = now;
    return result;
  } catch {
    return defaults;
  }
}
