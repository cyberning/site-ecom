import type { ThemeType } from "./themes";

/**
 * Valeurs par défaut de personnalisation du storefront.
 * Source unique de vérité : les défauts de style (couleurs, polices, rayons,
 * boutons, cartes) dépendent du thème actif, tandis que l'identité de la
 * marque et la bannière hero sont communes à tous les thèmes.
 * Les valeurs de couleurs/polices/rayons sont alignées sur src/styles/themes.css.
 */

export type CustomizationValues = Record<string, string | number>;

// ---------------------------------------------------------------------------
// Identité de la marque + hero : identiques pour tous les thèmes
// ---------------------------------------------------------------------------

export const BRAND_DEFAULTS: CustomizationValues = {
  custom_store_name: "Nom du magasin",
  custom_store_tagline: "Slogan du magasin",
  custom_footer_text: "Texte du pied de page",
  custom_contact_email: "email@exemple.com",
  custom_contact_phone: "+213 5XX XX XX XX",
  custom_contact_address: "Alger, Algérie",
  custom_hero_image: "",
  custom_hero_title: "Les meilleurs produits au meilleur prix",
};

// ---------------------------------------------------------------------------
// Défauts de style par thème
// ---------------------------------------------------------------------------

const NEUMORPHISM_STYLE: CustomizationValues = {
  custom_accent_color: "#4F46E5",
  custom_bg_primary: "#E0E5EC",
  custom_bg_secondary: "#D1D9E6",
  custom_bg_card: "#E0E5EC",
  custom_text_primary: "#2D3748",
  custom_text_secondary: "#4A5568",
  custom_border_color: "#CBD5E0",
  custom_font_primary: "Inter, sans-serif",
  custom_font_heading: "Inter, sans-serif",
  custom_font_size_base: 16,
  custom_font_size_heading: 24,
  custom_border_radius_sm: 8,
  custom_border_radius_md: 12,
  custom_border_radius_lg: 16,
  custom_border_radius_xl: 24,
  custom_spacing_unit: 4,
  custom_btn_style: "rounded",
  custom_btn_padding_x: 16,
  custom_btn_padding_y: 8,
  custom_btn_font_weight: "medium",
  custom_card_style: "neumorphic",
  custom_card_shadow: "medium",
  custom_card_padding: 24,
};

const LUXURY_STYLE: CustomizationValues = {
  custom_accent_color: "#D4AF37",
  custom_bg_primary: "#0B090A",
  custom_bg_secondary: "#161314",
  custom_bg_card: "#1A1718",
  custom_text_primary: "#F5F5F5",
  custom_text_secondary: "#D4D4D4",
  custom_border_color: "#333030",
  custom_font_primary: "Playfair Display, serif",
  custom_font_heading: "Playfair Display, serif",
  custom_font_size_base: 16,
  custom_font_size_heading: 26,
  custom_border_radius_sm: 0,
  custom_border_radius_md: 0,
  custom_border_radius_lg: 0,
  custom_border_radius_xl: 0,
  custom_spacing_unit: 4,
  custom_btn_style: "square",
  custom_btn_padding_x: 20,
  custom_btn_padding_y: 10,
  custom_btn_font_weight: "medium",
  custom_card_style: "bordered",
  custom_card_shadow: "light",
  custom_card_padding: 28,
};

const VIBRANT_STYLE: CustomizationValues = {
  custom_accent_color: "#CCFF00",
  custom_bg_primary: "#0F0F12",
  custom_bg_secondary: "#1A1A1F",
  custom_bg_card: "#1E1E24",
  custom_text_primary: "#FFFFFF",
  custom_text_secondary: "#E0E0E0",
  custom_border_color: "#2E2E36",
  custom_font_primary: "Space Grotesk, sans-serif",
  custom_font_heading: "Space Grotesk, sans-serif",
  custom_font_size_base: 16,
  custom_font_size_heading: 28,
  custom_border_radius_sm: 2,
  custom_border_radius_md: 4,
  custom_border_radius_lg: 4,
  custom_border_radius_xl: 8,
  custom_spacing_unit: 4,
  custom_btn_style: "square",
  custom_btn_padding_x: 20,
  custom_btn_padding_y: 10,
  custom_btn_font_weight: "bold",
  custom_card_style: "elevated",
  custom_card_shadow: "strong",
  custom_card_padding: 20,
};

const ORGANIC_STYLE: CustomizationValues = {
  custom_accent_color: "#6B8E23",
  custom_bg_primary: "#F7F5F0",
  custom_bg_secondary: "#EEEADF",
  custom_bg_card: "#F7F5F0",
  custom_text_primary: "#3D3B30",
  custom_text_secondary: "#5C5A4E",
  custom_border_color: "#D4D0C4",
  custom_font_primary: "Lora, serif",
  custom_font_heading: "Lora, serif",
  custom_font_size_base: 17,
  custom_font_size_heading: 26,
  custom_border_radius_sm: 12,
  custom_border_radius_md: 16,
  custom_border_radius_lg: 24,
  custom_border_radius_xl: 32,
  custom_spacing_unit: 6,
  custom_btn_style: "pill",
  custom_btn_padding_x: 24,
  custom_btn_padding_y: 12,
  custom_btn_font_weight: "medium",
  custom_card_style: "neumorphic",
  custom_card_shadow: "light",
  custom_card_padding: 28,
};

const TECH_STYLE: CustomizationValues = {
  custom_accent_color: "#00E5FF",
  custom_bg_primary: "#0A0E17",
  custom_bg_secondary: "#111827",
  custom_bg_card: "#151D2E",
  custom_text_primary: "#F1F5F9",
  custom_text_secondary: "#CBD5E1",
  custom_border_color: "#1E293B",
  custom_font_primary: "JetBrains Mono, monospace",
  custom_font_heading: "JetBrains Mono, monospace",
  custom_font_size_base: 15,
  custom_font_size_heading: 22,
  custom_border_radius_sm: 6,
  custom_border_radius_md: 8,
  custom_border_radius_lg: 12,
  custom_border_radius_xl: 16,
  custom_spacing_unit: 4,
  custom_btn_style: "rounded",
  custom_btn_padding_x: 18,
  custom_btn_padding_y: 9,
  custom_btn_font_weight: "medium",
  custom_card_style: "bordered",
  custom_card_shadow: "light",
  custom_card_padding: 20,
};

// ---------------------------------------------------------------------------
// Défauts complets par thème (marque + style)
// ---------------------------------------------------------------------------

export const THEME_DEFAULTS: Record<ThemeType, CustomizationValues> = {
  NEUMORPHISM: { ...BRAND_DEFAULTS, ...NEUMORPHISM_STYLE },
  LUXURY: { ...BRAND_DEFAULTS, ...LUXURY_STYLE },
  VIBRANT: { ...BRAND_DEFAULTS, ...VIBRANT_STYLE },
  ORGANIC: { ...BRAND_DEFAULTS, ...ORGANIC_STYLE },
  TECH: { ...BRAND_DEFAULTS, ...TECH_STYLE },
};

/**
 * Retourne les défauts de personnalisation du thème donné.
 * Fallback sur NEUMORPHISM si le thème est inconnu.
 */
export function getThemeDefaults(theme: ThemeType): CustomizationValues {
  return THEME_DEFAULTS[theme] ?? THEME_DEFAULTS.NEUMORPHISM;
}
